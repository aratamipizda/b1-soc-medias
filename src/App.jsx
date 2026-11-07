import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  Ban,
  Check,
  Feather,
  Heart,
  Leaf,
  LogOut,
  MessageCircle,
  Shield,
  Send,
  Sparkles,
  Trash2,
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

function PostCard({ post, currentUser, isAdmin, onComment, onDeleteComment, onLike, onViewProfile }) {
  const author = displayName(post.profiles);
  const comments = post.comments || [];
  const [commentText, setCommentText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [likeBusy, setLikeBusy] = useState(false);

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

  async function toggleLike() {
    setLikeBusy(true);
    setError("");
    try {
      await onLike(post.id, post.liked);
    } catch (likeError) {
      setError(likeError.message || "Your like couldn't be saved.");
    } finally {
      setLikeBusy(false);
    }
  }

  return (
    <article className="post-card">
      <div className="post-topline">
        <button className="post-author post-author-button" type="button" onClick={() => onViewProfile(post.user_id)}>
          <Avatar name={author} />
          <div><strong>{author}</strong><span>{formatDate(post.created_at)}</span></div>
        </button>
        {post.profiles?.role === "admin" && <span className="admin-badge"><Shield size={12} /> Admin</span>}
      </div>
      <p className="post-body">{post.content}</p>
      <div className="post-actions">
        <button type="button" className={`post-action ${post.liked ? "liked" : ""}`} onClick={toggleLike} disabled={likeBusy} aria-pressed={post.liked}>
          <Heart size={17} fill={post.liked ? "currentColor" : "none"} /> {post.likeCount} {post.likeCount === 1 ? "like" : "likes"}
        </button>
        <button type="button" className={`post-action ${commentsOpen ? "active" : ""}`} onClick={() => setCommentsOpen((open) => !open)}>
          <MessageCircle size={17} /> {comments.length} {comments.length === 1 ? "thought" : "thoughts"}
        </button>
        <span className="post-kind">a little kindness</span>
      </div>
      {commentsOpen && (
        <div className="comments-area">
          {comments.map((comment) => {
            const commenter = displayName(comment.profiles, comment.author_email);
            return (
              <div className="comment-row" key={comment.id}>
                <button className="comment-avatar-button" type="button" onClick={() => onViewProfile(comment.user_id)} aria-label={`View ${commenter}'s profile`}><Avatar name={commenter} size="small" /></button>
                <div className="comment-bubble"><div className="comment-heading"><button className="comment-name" type="button" onClick={() => onViewProfile(comment.user_id)}>{commenter}</button><span>{formatDate(comment.created_at)}</span></div><p>{comment.content}</p></div>
                {isAdmin && <button className="icon-button delete-comment" type="button" onClick={() => onDeleteComment(comment.id)} aria-label="Delete comment"><Trash2 size={14} /></button>}
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
  const [people, setPeople] = useState([]);
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [banned, setBanned] = useState(false);

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
    const [profileResult, postsResult, peopleResult] = await Promise.all([
      supabase.from("profiles").select("id, display_name, bio, role, banned_at").eq("id", session.user.id).maybeSingle(),
      supabase.from("posts").select("id, user_id, content, created_at, profiles(id, display_name, bio, role), comments(id, user_id, content, created_at, profiles(id, display_name, bio)), likes(user_id)").order("created_at", { ascending: false }).limit(50),
      supabase.from("profiles").select("id, display_name, bio, role, banned_at").order("display_name", { ascending: true }),
    ]);
    if (profileResult.error) throw profileResult.error;
    if (postsResult.error) throw postsResult.error;
    if (peopleResult.error) throw peopleResult.error;
    setProfile(profileResult.data);
    setPeople(peopleResult.data || []);
    setBanned(Boolean(profileResult.data?.banned_at));
    setProfileName(profileResult.data?.display_name || session.user.user_metadata?.display_name || "");
    setProfileBio(profileResult.data?.bio || "");
    setPosts((postsResult.data || []).map((post) => ({
      ...post,
      liked: (post.likes || []).some((like) => like.user_id === session.user.id),
      likeCount: (post.likes || []).length,
      comments: (post.comments || []).sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).map((comment) => ({
        ...comment,
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

  async function toggleLike(postId, liked) {
    const result = liked
      ? await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", session.user.id)
      : await supabase.from("likes").insert({ post_id: postId, user_id: session.user.id });
    if (result.error) throw result.error;
    await loadData();
  }

  async function deleteComment(commentId) {
    if (!window.confirm("Delete this comment? This cannot be undone.")) return;
    const { error: deleteError } = await supabase.from("comments").delete().eq("id", commentId);
    if (deleteError) {
      setError(deleteError.message || "The comment couldn't be deleted.");
      return;
    }
    await loadData();
  }

  async function setMemberBanned(member, shouldBan) {
    if (!window.confirm(`${shouldBan ? "Ban" : "Unban"} ${member.display_name}?`)) return;
    setError("");
    setSuccess("");
    const { error: moderationError } = await supabase.rpc("set_user_banned", {
      target_user_id: member.id,
      should_ban: shouldBan,
    });
    if (moderationError) {
      setError(moderationError.message || `This member could not be ${shouldBan ? "banned" : "unbanned"}.`);
      return;
    }
    setSuccess(`${member.display_name} has been ${shouldBan ? "banned" : "unbanned"}.`);
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
        .update({ display_name: cleanName, bio: profileBio.trim() })
        .eq("id", session.user.id)
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
  if (banned) {
    return (
      <main className="loading-screen">
        <div className="banned-notice">
          <Ban size={28} />
          <h1>This account has been suspended.</h1>
          <p>Contact a community admin if you think this was a mistake.</p>
          <button className="button button-primary" type="button" onClick={signOut}>Sign out</button>
        </div>
      </main>
    );
  }

  const currentUser = { profile, email: session.user.email };
  const name = displayName(profile, session.user.email);
  const isAdmin = profile?.role === "admin";
  const selectedProfile = selectedProfileId === session.user.id
    ? profile
    : people.find((member) => member.id === selectedProfileId);
  const selectedProfileName = displayName(selectedProfile, "");
  const viewedPosts = posts.filter((post) => post.user_id === selectedProfileId);

  function viewProfile(profileId) {
    setSelectedProfileId(profileId);
    setPage("profile");
    setError("");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="wordmark sidebar-brand" href="#" onClick={(event) => { event.preventDefault(); setPage("feed"); }}><span className="logo-mark"><Leaf size={19} /></span> kindred<span className="wordmark-period">.</span></a>
        <div className="sidebar-caption">YOUR LITTLE CORNER</div>
        <nav className="main-nav" aria-label="Main navigation">
          <button type="button" className={`nav-item ${page === "feed" ? "nav-active" : ""}`} onClick={() => setPage("feed")}><span className="nav-icon"><Sparkles size={18} /></span> Feed</button>
          <button type="button" className={`nav-item ${page === "people" ? "nav-active" : ""}`} onClick={() => setPage("people")}><span className="nav-icon"><UsersRound size={18} /></span> People</button>
          <button type="button" className={`nav-item ${page === "profile" && selectedProfileId === session.user.id ? "nav-active" : ""}`} onClick={() => viewProfile(session.user.id)}><span className="nav-icon"><UserRound size={18} /></span> Profile</button>
          {isAdmin && <button type="button" className={`nav-item ${page === "admin" ? "nav-active" : ""}`} onClick={() => setPage("admin")}><span className="nav-icon"><Shield size={18} /></span> Admin</button>}
        </nav>
        <div className="sidebar-community"><div className="community-icon"><UsersRound size={18} /></div><strong>Good company</strong><p>A place for kind words, little wins, and whatever’s on your mind.</p><span><span className="online-dot" /> YOU’RE RIGHT AT HOME</span></div>
        <div className="sidebar-user">
          <Avatar name={name} />
          <div className="sidebar-user-info"><strong>{name}</strong><span>Your account</span></div>
          <button type="button" className="icon-button signout-button" onClick={signOut} aria-label="Sign out"><LogOut size={17} /></button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar"><div><span className="topbar-overline">A LITTLE MORE CONNECTED</span><h1>{page === "feed" ? "Your little corner" : page === "people" ? "Good company" : page === "admin" ? "Community care" : selectedProfileId === session.user.id ? "A bit about you" : `${selectedProfileName}'s profile`}</h1></div><button className="button button-light topbar-profile" onClick={() => viewProfile(session.user.id)}><Avatar name={name} size="small" /> Your profile <ArrowRight size={15} /></button></header>
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
              {posts.length ? <div className="post-list">{posts.map((post) => <PostCard key={post.id} post={post} currentUser={currentUser} isAdmin={isAdmin} onComment={createComment} onDeleteComment={deleteComment} onLike={toggleLike} onViewProfile={viewProfile} />)}</div> : <div className="empty-feed"><span>✳</span><h3>A blank page, in the best way.</h3><p>No thoughts have been shared yet. Be the first to say hello.</p></div>}
              <button className="back-top" type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><ArrowLeft size={15} /> Back to the top</button>
            </section>
            <aside className="feed-aside">
              <div className="aside-card about-card"><span className="aside-icon"><Heart size={17} /></span><span className="eyebrow">A GENTLE REMINDER</span><h3>There’s room for your voice here.</h3><p>Share the small stuff, cheer each other on, and be kind. That’s the whole thing.</p><div className="about-divider" /><span className="aside-signoff">Glad you’re here <span>♡</span></span></div>
              <div className="aside-card profile-mini"><div className="profile-mini-top"><Avatar name={name} /><div><strong>{name}</strong><span>Making a little space online</span></div></div><p>{profile?.bio || "Add a little something about yourself and help your new neighbors get to know you."}</p><button type="button" className="text-link" onClick={() => viewProfile(session.user.id)}>Get to know me <ArrowRight size={14} /></button></div>
              <span className="aside-footer">KINDRED <span>·</span> A SMALL CORNER OF THE INTERNET</span>
            </aside>
          </div>
        ) : page === "profile" ? (
          <section className="profile-layout">
            <div className="profile-cover"><span>✳</span><span>✿</span></div>
            <div className="profile-content">
              {!selectedProfile && <div className="empty-feed"><h3>We couldn’t find that profile.</h3><button className="text-link" type="button" onClick={() => setPage("people")}>Browse people <ArrowRight size={14} /></button></div>}
              {selectedProfile && <div className="profile-title"><Avatar name={selectedProfileName} size="large" /><div><span className="eyebrow">{selectedProfileId === session.user.id ? "YOUR LITTLE INTRODUCTION" : "A LITTLE INTRODUCTION"}</span><h2>{selectedProfileName}</h2>{selectedProfile.role === "admin" && <span className="admin-badge"><Shield size={12} /> Community admin</span>}</div></div>}
              {selectedProfileId === session.user.id && selectedProfile && <form className="profile-form" onSubmit={saveProfile}>
                <div className="profile-form-heading"><h3>Your profile</h3><p>A few words to help people get to know you.</p></div>
                <label className="field-label">Display name<input className="plain-input" required maxLength={40} value={profileName} onChange={(event) => setProfileName(event.target.value)} placeholder="Your name" /></label>
                <label className="field-label">A little about you<textarea className="plain-input profile-bio" maxLength={160} rows={4} value={profileBio} onChange={(event) => setProfileBio(event.target.value)} placeholder="What do you love? What brings you here?" /></label>
                <div className="profile-form-footer"><span>{profileBio.length}/160</span><button className="button button-primary" type="submit" disabled={savingProfile}>{savingProfile ? "Saving…" : "Save profile"} {!savingProfile && <Check size={16} />}</button></div>
              </form>}
              {selectedProfileId !== session.user.id && selectedProfile && <p className="public-profile-bio">{selectedProfile.bio || "This neighbor hasn’t added a bio yet."}</p>}
              <div className="profile-posts-heading"><div><span className="eyebrow">YOUR WORDS</span><h3>{selectedProfileId === session.user.id ? "Your thoughts" : `${selectedProfileName}'s thoughts`} <span>{viewedPosts.length}</span></h3></div><button type="button" className="text-link" onClick={() => setPage("feed")}><ArrowLeft size={14} /> Back to feed</button></div>
              {viewedPosts.length ? <div className="post-list">{viewedPosts.map((post) => <PostCard key={post.id} post={post} currentUser={currentUser} isAdmin={isAdmin} onComment={createComment} onDeleteComment={deleteComment} onLike={toggleLike} onViewProfile={viewProfile} />)}</div> : <div className="empty-feed profile-empty"><span>✳</span><h3>{selectedProfileId === session.user.id ? "Your story starts here." : "No thoughts shared yet."}</h3><p>{selectedProfileId === session.user.id ? "When you share your first thought, it’ll find a home right here." : "Check back when they’ve shared something with the community."}</p>{selectedProfileId === session.user.id && <button type="button" className="text-link" onClick={() => setPage("feed")}>Write your first post <ArrowRight size={14} /></button>}</div>}
            </div>
          </section>
        ) : page === "people" ? (
          <section className="people-page">
            <div className="people-intro"><span className="eyebrow">THE NEIGHBORHOOD</span><h2>Meet your people.</h2><p>Get to know the folks sharing this little corner with you.</p></div>
            {people.length ? <div className="people-grid">{people.map((member) => <article className="person-card" key={member.id}>
              <Avatar name={displayName(member, "")} size="large" />
              <h3>{displayName(member, "")}</h3>
              {member.role === "admin" && <span className="admin-badge"><Shield size={12} /> Community admin</span>}
              <p>{member.bio || "A neighbor in the Kindred community."}</p>
              <button className="button button-light" type="button" onClick={() => viewProfile(member.id)}>View profile <ArrowRight size={15} /></button>
            </article>)}</div> : <div className="empty-feed"><h3>No neighbors yet.</h3><p>Check back when more people join.</p></div>}
          </section>
        ) : (
          <section className="admin-page">
            <div className="admin-intro"><span className="eyebrow"><Shield size={13} /> ADMIN TOOLS</span><h2>Keep this a kind place.</h2><p>Manage memberships and remove comments that don’t belong. Changes take effect immediately.</p></div>
            <div className="admin-section"><div className="admin-section-heading"><div><h3>Community members</h3><p>{people.length} {people.length === 1 ? "person" : "people"}</p></div></div>
              <div className="member-list">{people.map((member) => <article className="member-row" key={member.id}><button className="member-identity" type="button" onClick={() => viewProfile(member.id)}><Avatar name={displayName(member, "")} size="small" /><span><strong>{displayName(member, "")}</strong><small>{member.role === "admin" ? "Admin" : "Member"}{member.banned_at ? " · Banned" : ""}</small></span></button>{member.id !== session.user.id && member.role !== "admin" && <button className={`button ${member.banned_at ? "button-light" : "button-danger"}`} type="button" onClick={() => setMemberBanned(member, !member.banned_at)}>{member.banned_at ? <UsersRound size={14} /> : <Ban size={14} />}{member.banned_at ? "Unban" : "Ban"}</button>}</article>)}</div>
            </div>
            <div className="admin-section"><div className="admin-section-heading"><div><h3>Recent comments</h3><p>Remove comments from the feed if they break community guidelines.</p></div></div>
              <div className="moderation-comments">{posts.flatMap((post) => (post.comments || []).map((comment) => ({ ...comment, postContent: post.content, postId: post.id }))).slice(0, 30).map((comment) => <article className="moderation-comment" key={comment.id}><div><strong>{displayName(comment.profiles, "")}</strong><p>{comment.content}</p><small>On: {comment.postContent}</small></div><button className="icon-button delete-comment" type="button" onClick={() => deleteComment(comment.id)} aria-label="Delete comment"><Trash2 size={16} /></button></article>)}</div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
