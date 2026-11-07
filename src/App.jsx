import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  Check,
  Feather,
  Heart,
  Leaf,
  LogOut,
  MessageCircle,
  MoreHorizontal,
  Send,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";
import { isSupabaseConfigured, supabase } from "./supabase.js";

const formatDate = (date) =>
  new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));

const displayName = (profile, email) =>
  profile?.display_name || email?.split("@")[0] || "friend";

function Avatar({ name, size = "normal" }) {
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return <span className={`avatar avatar-${size}`} aria-label={name}>{initials}</span>;
}

function Notice({ children, tone = "error" }) {
  if (!children) return null;
  return <p className={`notice notice-${tone}`} role="status">{children}</p>;
}

function AuthScreen() {
  const [mode, setMode] = useState("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");

    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { display_name: name.trim() },
            emailRedirectTo: window.location.origin,
          },
        });
        if (signUpError) throw signUpError;
        if (!data.session) {
          setMessage("Check your inbox to confirm your email, then come back to sign in.");
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
      }
    } catch (submitError) {
      setError(submitError.message || "We couldn't complete that. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-left">
        <a className="wordmark" href="#" aria-label="Kindred home">
          <span className="logo-mark"><Leaf size={19} strokeWidth={2.2} /></span>
          kindred<span className="wordmark-period">.</span>
        </a>
        <div className="auth-copy">
          <span className="eyebrow"><Sparkles size={14} /> A LITTLE MORE CONNECTED</span>
          <h1>Good things<br />grow <em>together.</em></h1>
          <p>A softer corner of the internet to share what’s on your mind and find your people.</p>
          <div className="community-note">
            <div className="avatar-stack" aria-hidden="true">
              <Avatar name="Mia" size="small" /><Avatar name="Theo" size="small" /><Avatar name="Jules" size="small" />
            </div>
            <span>Small thoughts. Real connections.</span>
          </div>
        </div>
        <div className="auth-decoration decoration-one"><span>✳</span></div>
        <div className="auth-decoration decoration-two"><span>✿</span></div>
        <span className="auth-bottom">MADE FOR THE MOMENTS IN BETWEEN</span>
      </div>

      <section className="auth-right">
        <div className="auth-form-wrap">
          <div className="mobile-wordmark"><span className="logo-mark"><Leaf size={19} /></span> kindred<span className="wordmark-period">.</span></div>
          <div className="auth-heading">
            <p className="eyebrow">YOUR PEOPLE ARE HERE</p>
            <h2>{mode === "signup" ? "Come on in." : "Welcome back."}</h2>
            <p>{mode === "signup" ? "Make yourself at home. It takes a minute." : "We saved you a seat."}</p>
          </div>
          <div className="auth-tabs" role="tablist" aria-label="Account options">
            <button type="button" className={mode === "signup" ? "selected" : ""} onClick={() => { setMode("signup"); setError(""); setMessage(""); }}>Create account</button>
            <button type="button" className={mode === "signin" ? "selected" : ""} onClick={() => { setMode("signin"); setError(""); setMessage(""); }}>Sign in</button>
          </div>
          <form className="auth-form" onSubmit={submit}>
            {mode === "signup" && (
              <label className="field-label">
                Your name
                <span className="input-wrap"><UserRound size={17} /><input autoComplete="name" required maxLength={40} value={name} onChange={(event) => setName(event.target.value)} placeholder="What should we call you?" /></span>
              </label>
            )}
            <label className="field-label">
              Email address
              <span className="input-wrap"><AtSign size={17} /><input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></span>
            </label>
            <label className="field-label">
              Password
              <span className="input-wrap"><span className="password-dot" /><input type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" /></span>
            </label>
            <Notice>{error}</Notice>
            <Notice tone="success">{message}</Notice>
            <button className="button button-primary auth-submit" type="submit" disabled={busy}>
              {busy ? "One moment…" : mode === "signup" ? "Create your account" : "Sign in"}
              {!busy && <ArrowRight size={17} />}
            </button>
          </form>
          <p className="privacy-note"><Check size={14} /> Your little corner stays yours. Always.</p>
        </div>
        <span className="auth-copyright">© 2025 KINDRED COMMUNITY</span>
      </section>
    </main>
  );
}

function PostCard({ post, currentUser, onComment }) {
  const author = displayName(post.profiles, post.author_email);
  const comments = post.comments || [];
  const [commentText, setCommentText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [commentsOpen, setCommentsOpen] = useState(false);

  async function submitComment(event) {
    event.preventDefault();
    const body = commentText.trim();
    if (!body) return;
    setBusy(true);
    setError("");
    try {
      await onComment(post.id, body);
      setCommentText("");
      setCommentsOpen(true);
    } catch (submitError) {
      setError(submitError.message || "Your comment couldn't be posted.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="post-card">
      <div className="post-topline">
        <div className="post-author">
          <Avatar name={author} />
          <div><strong>{author}</strong><span>{formatDate(post.created_at)}</span></div>
        </div>
        <button className="icon-button post-menu" type="button" aria-label="Post options"><MoreHorizontal size={20} /></button>
      </div>
      <p className="post-body">{post.content}</p>
      <div className="post-actions">
        <button type="button" className={`post-action ${commentsOpen ? "active" : ""}`} onClick={() => setCommentsOpen((open) => !open)}>
          <MessageCircle size={17} /> {comments.length} {comments.length === 1 ? "thought" : "thoughts"}
        </button>
        <span className="post-kind"><Heart size={14} /> a little kindness</span>
      </div>
      {commentsOpen && (
        <div className="comments-area">
          {comments.map((comment) => {
            const commenter = displayName(comment.profiles, comment.author_email);
            return (
              <div className="comment-row" key={comment.id}>
                <Avatar name={commenter} size="small" />
                <div className="comment-bubble"><div className="comment-heading"><strong>{commenter}</strong><span>{formatDate(comment.created_at)}</span></div><p>{comment.content}</p></div>
              </div>
            );
          })}
          {comments.length === 0 && <p className="empty-comments">No thoughts yet. You could be the first.</p>}
          <form className="comment-form" onSubmit={submitComment}>
            <Avatar name={displayName(currentUser.profile, currentUser.email)} size="small" />
            <input aria-label="Write a comment" maxLength={500} value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Add a thought…" />
            <button type="submit" aria-label="Post comment" disabled={busy || !commentText.trim()}><Send size={16} /></button>
          </form>
          {error && <Notice>{error}</Notice>}
        </div>
      )}
    </article>
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState("feed");
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profileName, setProfileName] = useState("");
  const [profileBio, setProfileBio] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return undefined;
    }
    let active = true;
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) setError(sessionError.message);
      setSession(data?.session ?? null);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadData = useCallback(async () => {
    if (!session?.user) return;
    setError("");
    const [profileResult, postsResult] = await Promise.all([
      supabase.from("profiles").select("id, display_name, bio").eq("id", session.user.id).maybeSingle(),
      supabase.from("posts").select("id, user_id, content, created_at, profiles(display_name), comments(id, user_id, content, created_at, profiles(display_name))").order("created_at", { ascending: false }).limit(50),
    ]);
    if (profileResult.error) throw profileResult.error;
    if (postsResult.error) throw postsResult.error;
    setProfile(profileResult.data);
    setProfileName(profileResult.data?.display_name || session.user.user_metadata?.display_name || "");
    setProfileBio(profileResult.data?.bio || "");
    setPosts((postsResult.data || []).map((post) => ({
      ...post,
      author_email: post.user_id === session.user.id ? session.user.email : "",
      comments: (post.comments || []).sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map((comment) => ({
        ...comment,
        author_email: comment.user_id === session.user.id ? session.user.email : "",
      })),
    })));
  }, [session]);

  useEffect(() => {
    if (!session) {
      setProfile(null);
      setPosts([]);
      return;
    }
    loadData().catch((loadError) => setError(loadError.message || "We couldn't load the community."));
  }, [session, loadData]);

  const ownPosts = useMemo(() => posts.filter((post) => post.user_id === session?.user?.id), [posts, session]);

  async function createPost(event) {
    event.preventDefault();
    const content = draft.trim();
    if (!content) return;
    setPosting(true);
    setError("");
    try {
      const { error: postError } = await supabase.from("posts").insert({ user_id: session.user.id, content });
      if (postError) throw postError;
      setDraft("");
      await loadData();
    } catch (postError) {
      setError(postError.message || "Your post couldn't be shared.");
    } finally {
      setPosting(false);
    }
  }

  async function createComment(postId, content) {
    const { error: commentError } = await supabase.from("comments").insert({ post_id: postId, user_id: session.user.id, content });
    if (commentError) throw commentError;
    await loadData();
  }

  async function saveProfile(event) {
    event.preventDefault();
    const cleanName = profileName.trim();
    if (!cleanName) {
      setError("Please enter a name for your profile.");
      return;
    }
    setSavingProfile(true);
    setError("");
    setSuccess("");
    try {
      const { data, error: profileError } = await supabase
        .from("profiles")
        .upsert({ id: session.user.id, display_name: cleanName, bio: profileBio.trim() }, { onConflict: "id" })
        .select("id, display_name, bio")
        .single();
      if (profileError) throw profileError;
      setProfile(data);
      setSuccess("Your profile is looking good. Saved!");
      await loadData();
    } catch (saveError) {
      setError(saveError.message || "We couldn't save your profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function signOut() {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) setError(signOutError.message);
  }

  if (!isSupabaseConfigured) {
    return (
      <main className="setup-page">
        <div className="setup-card">
          <a className="wordmark" href="#"><span className="logo-mark"><Leaf size={19} /></span> kindred<span className="wordmark-period">.</span></a>
          <span className="eyebrow"><Sparkles size={14} /> ONE LITTLE SETUP STEP</span>
          <h1>Let’s get your<br /><em>community</em> connected.</h1>
          <p>Add your Supabase project details to get the app going. They live in a local environment file and won’t be committed to GitHub.</p>
          <ol className="setup-steps">
            <li><span>1</span> Copy <code>.env.example</code> to <code>.env.local</code>.</li>
            <li><span>2</span> Add your Supabase project URL and anon key.</li>
            <li><span>3</span> Run <code>supabase/schema.sql</code> in the Supabase SQL Editor.</li>
            <li><span>4</span> Restart the dev server with <code>npm run dev</code>.</li>
          </ol>
          <p className="setup-note"><Check size={15} /> The anon key is designed for browser use. Never put a service-role key in the app.</p>
        </div>
      </main>
    );
  }

  if (loading) {
    return <main className="loading-screen"><span className="logo-mark"><Leaf size={19} /></span><span>Making yourself at home…</span></main>;
  }
  if (!session) return <AuthScreen />;

  const currentUser = { profile, email: session.user.email };
  const name = displayName(profile, session.user.email);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="wordmark sidebar-brand" href="#" onClick={(event) => { event.preventDefault(); setPage("feed"); }}><span className="logo-mark"><Leaf size={19} /></span> kindred<span className="wordmark-period">.</span></a>
        <div className="sidebar-caption">YOUR LITTLE CORNER</div>
        <nav className="main-nav" aria-label="Main navigation">
          <button type="button" className={`nav-item ${page === "feed" ? "nav-active" : ""}`} onClick={() => setPage("feed")}><span className="nav-icon"><Sparkles size={18} /></span> Your feed</button>
          <button type="button" className={`nav-item ${page === "profile" ? "nav-active" : ""}`} onClick={() => setPage("profile")}><span className="nav-icon"><UserRound size={18} /></span> Your profile</button>
        </nav>
        <div className="sidebar-community"><div className="community-icon"><UsersRound size={18} /></div><strong>Good company</strong><p>A place for kind words, little wins, and whatever’s on your mind.</p><span><span className="online-dot" /> YOU’RE RIGHT AT HOME</span></div>
        <div className="sidebar-user">
          <Avatar name={name} />
          <div className="sidebar-user-info"><strong>{name}</strong><span>Your account</span></div>
          <button type="button" className="icon-button signout-button" onClick={signOut} aria-label="Sign out"><LogOut size={17} /></button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar"><div><span className="topbar-overline">A LITTLE MORE CONNECTED</span><h1>{page === "feed" ? "Your little corner" : "A bit about you"}</h1></div><button className="button button-light topbar-profile" onClick={() => setPage("profile")}><Avatar name={name} size="small" /> Your profile <ArrowRight size={15} /></button></header>
        {error && <div className="main-notice"><Notice>{error}</Notice></div>}
        {success && <div className="main-notice"><Notice tone="success">{success}</Notice></div>}

        {page === "feed" ? (
          <div className="feed-layout">
            <section className="feed-column">
              <div className="welcome-strip"><span className="welcome-sparkle">✳</span><div><strong>Hey, {name}.</strong><p>It’s good to have you here. What’s on your mind?</p></div></div>
              <form className="composer-card" onSubmit={createPost}>
                <div className="composer-top"><Avatar name={name} /><textarea aria-label="Write a post" maxLength={1000} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Share a thought, a small win, or something you love…" rows={3} /></div>
                <div className="composer-bottom"><span><Feather size={15} /> A little kindness goes a long way</span><button className="button button-primary" type="submit" disabled={posting || !draft.trim()}>{posting ? "Sharing…" : "Share a thought"} {!posting && <ArrowRight size={16} />}</button></div>
              </form>
              <div className="feed-heading"><div><span className="eyebrow">THE NEIGHBORHOOD</span><h2>Latest thoughts</h2></div><span className="feed-count">{posts.length} {posts.length === 1 ? "post" : "posts"}</span></div>
              {posts.length ? <div className="post-list">{posts.map((post) => <PostCard key={post.id} post={post} currentUser={currentUser} onComment={createComment} />)}</div> : <div className="empty-feed"><span>✳</span><h3>A blank page, in the best way.</h3><p>No thoughts have been shared yet. Be the first to say hello.</p></div>}
              <button className="back-top" type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><ArrowLeft size={15} /> Back to the top</button>
            </section>
            <aside className="feed-aside">
              <div className="aside-card about-card"><span className="aside-icon"><Heart size={17} /></span><span className="eyebrow">A GENTLE REMINDER</span><h3>There’s room for your voice here.</h3><p>Share the small stuff, cheer each other on, and be kind. That’s the whole thing.</p><div className="about-divider" /><span className="aside-signoff">Glad you’re here <span>♡</span></span></div>
              <div className="aside-card profile-mini"><div className="profile-mini-top"><Avatar name={name} /><div><strong>{name}</strong><span>Making a little space online</span></div></div><p>{profile?.bio || "Add a little something about yourself and help your new neighbors get to know you."}</p><button type="button" className="text-link" onClick={() => setPage("profile")}>Get to know me <ArrowRight size={14} /></button></div>
              <span className="aside-footer">KINDRED <span>·</span> A SMALL CORNER OF THE INTERNET</span>
            </aside>
          </div>
        ) : (
          <section className="profile-layout">
            <div className="profile-cover"><span>✳</span><span>✿</span></div>
            <div className="profile-content">
              <div className="profile-title"><Avatar name={name} size="large" /><div><span className="eyebrow">YOUR LITTLE INTRODUCTION</span><h2>{name}</h2><p>{session.user.email}</p></div></div>
              <form className="profile-form" onSubmit={saveProfile}>
                <div className="profile-form-heading"><h3>Your profile</h3><p>A few words to help people get to know you.</p></div>
                <label className="field-label">Display name<input className="plain-input" required maxLength={40} value={profileName} onChange={(event) => setProfileName(event.target.value)} placeholder="Your name" /></label>
                <label className="field-label">A little about you<textarea className="plain-input profile-bio" maxLength={160} rows={4} value={profileBio} onChange={(event) => setProfileBio(event.target.value)} placeholder="What do you love? What brings you here?" /></label>
                <div className="profile-form-footer"><span>{profileBio.length}/160</span><button className="button button-primary" type="submit" disabled={savingProfile}>{savingProfile ? "Saving…" : "Save profile"} {!savingProfile && <Check size={16} />}</button></div>
              </form>
              <div className="profile-posts-heading"><div><span className="eyebrow">YOUR WORDS</span><h3>Your thoughts <span>{ownPosts.length}</span></h3></div><button type="button" className="text-link" onClick={() => setPage("feed")}><ArrowLeft size={14} /> Back to feed</button></div>
              {ownPosts.length ? <div className="post-list">{ownPosts.map((post) => <PostCard key={post.id} post={post} currentUser={currentUser} onComment={createComment} />)}</div> : <div className="empty-feed profile-empty"><span>✳</span><h3>Your story starts here.</h3><p>When you share your first thought, it’ll find a home right here.</p><button type="button" className="text-link" onClick={() => setPage("feed")}>Write your first post <ArrowRight size={14} /></button></div>}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
