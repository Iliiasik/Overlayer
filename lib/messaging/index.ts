import { browser } from 'wxt/browser';

export const MessageType = {
  ToggleCanvas: 'canvas/toggle',
  ToggleMarks: 'marks/toggle-visibility',
  GetState: 'state/get',
  CreateHighlight: 'highlighter/create',
  FetchImage: 'image/fetch',
} as const;

export type MessageTypeValue = (typeof MessageType)[keyof typeof MessageType];

export interface Message {
  type: MessageTypeValue;
  url?: string;
}

export interface ExtensionState {
  canvasOpen: boolean;
  marksVisible: boolean;
  markCount: number;
  itemCount: number;
}

export async function sendToActiveTab<TResponse = void>(message: Message): Promise<TResponse> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (tab?.id == null) throw new Error('no active tab');
  return (await browser.tabs.sendMessage(tab.id, message)) as TResponse;
}

export async function sendToBackground<TResponse = void>(message: Message): Promise<TResponse> {
  return (await browser.runtime.sendMessage(message)) as TResponse;
}

export function onMessage(type: MessageTypeValue, handler: (message: Message) => unknown): void {
  browser.runtime.onMessage.addListener(
    (message: unknown, _sender, sendResponse: (response: unknown) => void) => {
      if ((message as Message | undefined)?.type !== type) return;
      void Promise.resolve(handler(message as Message)).then(sendResponse);
      return true;
    },
  );
}
