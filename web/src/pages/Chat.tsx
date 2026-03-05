import { createSignal, Show, type Component } from "solid-js";

const Chat: Component = () => {
  const [showConvo, setShowConvo] = createSignal(false);

  return (
    <>
      <Show when={!showConvo()}>
        {/* Chat List */}
        <div class="nav-header">
          <h1>Chat</h1>
        </div>
        <div>
          <div class="chat-row" onClick={() => setShowConvo(true)}>
            <div class="chat-avatar avatar-photo">SK</div>
            <div class="chat-body">
              <div class="chat-name">Sam K.</div>
              <div class="chat-preview">Sounds great! See you at the run tomorrow</div>
            </div>
            <div class="chat-meta">
              <div class="chat-time">2:30 PM</div>
              <div class="chat-unread" />
            </div>
          </div>
          <div class="chat-row">
            <div class="chat-avatar group">MR</div>
            <div class="chat-body">
              <div class="chat-name">Morning Run Group</div>
              <div class="chat-preview">Maya: I'll bring coffee for everyone!</div>
            </div>
            <div class="chat-meta">
              <div class="chat-time">11:15 AM</div>
            </div>
          </div>
          <div class="chat-row">
            <div class="chat-avatar">TJ</div>
            <div class="chat-body">
              <div class="chat-name">Tyler J.</div>
              <div class="chat-preview">Have you read the new Ishiguro?</div>
            </div>
            <div class="chat-meta">
              <div class="chat-time">Yesterday</div>
            </div>
          </div>
          <div class="chat-row">
            <div class="chat-avatar group">PS</div>
            <div class="chat-body">
              <div class="chat-name">Park Slope Foodies</div>
              <div class="chat-preview">Next potluck is Saturday!</div>
            </div>
            <div class="chat-meta">
              <div class="chat-time">Mon</div>
            </div>
          </div>
        </div>
        <div class="report-hint">
          Something wrong? <a href="#" onClick={(e) => e.preventDefault()}>Report a user</a>
        </div>
      </Show>

      <Show when={showConvo()}>
        {/* Conversation View */}
        <div class="convo-header">
          <button class="convo-back" onClick={() => setShowConvo(false)}>
            <svg width="12" height="20" viewBox="0 0 12 20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M10 2L2 10l8 8" /></svg>
          </button>
          <div class="convo-avatar avatar-photo">SK</div>
          <div>
            <span class="convo-name">Sam K.</span>
            <span class="convo-verified">✓ Verified</span>
          </div>
        </div>
        <div class="convo-messages">
          <div class="msg-time">Today 2:15 PM</div>
          <div class="msg msg-received">Hey! I saw we're both runners. Do you go to Prospect Park in the mornings?</div>
          <div class="msg msg-sent">Yes! Almost every day around 7. It's the best time before it gets crowded.</div>
          <div class="msg msg-received">Same! I usually start at the Grand Army entrance. Maybe we could do a run together sometime?</div>
          <div class="msg msg-sent">That'd be great! There's actually a Morning Run Club event this Saturday at 7 AM</div>
          <div class="msg msg-sent">Want to join?</div>
          <div class="msg msg-received">Sounds great! See you at the run tomorrow</div>
        </div>
        <div class="convo-input">
          <input type="text" placeholder="Message" />
          <button class="send-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
          </button>
        </div>
      </Show>
    </>
  );
};

export default Chat;
