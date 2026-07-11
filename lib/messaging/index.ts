import { browser } from 'wxt/browser';

export const MessageType = {
  ToggleCanvas: 'canvas/toggle',
  ToggleMarks: 'marks/toggle-visibility',
  GetState: 'state/get',
  CreateHighlight: 'highlighter/create',
} as const;

export type MessageTypeValue = (typeof MessageType)[keyof typeof MessageType];

export interface Message {
  type: MessageTypeValue;
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

export function onMessage(type: MessageTypeValue, handler: () => unknown): void {
  browser.runtime.onMessage.addListener(
    (message: unknown, _sender, sendResponse: (response: unknown) => void) => {
      if ((message as Message | undefined)?.type !== type) return;
      void Promise.resolve(handler()).then(sendResponse);
      return true;
    },
  );
}
