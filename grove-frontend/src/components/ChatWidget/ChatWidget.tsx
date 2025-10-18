import React from 'react';
import { postChat } from '@/utils/chatApi';
import { getOrCreateSessionId } from '@/utils/session';
import weavyIcon from '@/assets/weavy.png';

interface MessageItem {
  id: string; // local id
  role: 'user' | 'assistant' | 'system';
  text: string;
  pending?: boolean;
  error?: string | null;
}

export const ChatWidget: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState('');
  const [messages, setMessages] = React.useState<MessageItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const sessionIdRef = React.useRef<string>(getOrCreateSessionId());
  const abortRef = React.useRef<AbortController | null>(null);
  const listRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [open, messages.length]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setError(null);
    setLoading(true);
    const localId = `${Date.now()}`;
    setMessages(prev => [...prev, { id: localId, role: 'user', text }]);
    setInput('');

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    try {
      const res = await postChat({ query: text, id: sessionIdRef.current }, abortRef.current.signal);
      setMessages(prev => [...prev, { id: `${localId}-res`, role: 'assistant', text: res.answer }]);
    } catch (e: any) {
      const msg = e?.message || '요청 중 오류가 발생했습니다';
      setError(msg);
      setMessages(prev => [...prev, { id: `${localId}-err`, role: 'system', text: '오류가 발생했습니다. 다시 시도해주세요.', error: msg }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        aria-label={open ? '채팅 창 닫기' : '채팅 창 열기'}
        onClick={() => setOpen(v => !v)}
        className="fixed z-[60] bottom-6 right-6 w-[84px] h-[84px] rounded-full bg-amber-600 text-white shadow-lg hover:bg-amber-700 focus:outline-none focus:ring-4 focus:ring-amber-300"
      >
        {open ? (
          <span className="text-4xl" aria-hidden>×</span>
        ) : (
          <img src={weavyIcon} alt="챗봇 아이콘" className="w-[72px] h-[72px] inline-block align-middle object-contain" />
        )}
      </button>

      {/* Chat Panel */}
      {open && (
        <div className="fixed z-[59] bottom-28 right-6 w-[360px] max-w-[calc(100vw-24px)] h-[560px] max-h-[70vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50">
            <div className="font-semibold text-gray-800">대화</div>
            <div className="text-[10px] text-gray-500 select-none">세션: {sessionIdRef.current.slice(0, 8)}</div>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 text-sm mt-8">대화를 시작해보세요.</div>
            )}
            {messages.map(m => (
              <div key={m.id} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div className={(m.role === 'user' ? 'bg-amber-600 text-white' : 'bg-white text-gray-800') + ' max-w-[80%] rounded-2xl px-4 py-2 shadow'}>
                  <div className="whitespace-pre-wrap text-sm">{m.text}</div>
                  {m.error && <div className="text-[11px] mt-1 text-red-600">{m.error}</div>}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-800 max-w-[80%] rounded-2xl px-4 py-2 shadow">
                  <div className="text-sm animate-pulse">응답 작성 중...</div>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="px-4 py-2 text-sm text-red-600 bg-red-50 border-t border-red-100">{error}</div>
          )}

          <form
            className="p-3 border-t border-gray-200 bg-white flex items-center gap-2"
            onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
          >
            <input
              aria-label="메시지 입력"
              className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="메시지를 입력하세요..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return;
                // 한글/일본어 등 IME 조합 중일 때는 전송하지 않음
                const anyEvt: any = e.nativeEvent as any;
                if (anyEvt?.isComposing || (anyEvt?.keyCode === 229)) return;
                e.preventDefault();
                sendMessage();
              }}
            />
            <button
              type="submit"
              disabled={loading || input.trim().length === 0}
              className="px-3 py-2 rounded-lg bg-amber-600 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-amber-700"
            >
              전송
            </button>
          </form>
        </div>
      )}
    </>
  );
};


