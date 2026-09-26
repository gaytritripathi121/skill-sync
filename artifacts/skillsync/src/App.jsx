import { useEffect, useMemo, useState } from 'react';
import { ClerkProvider, SignIn, SignUp, useAuth, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Bell, BriefcaseBusiness, Check, ChevronRight, CircleUserRound, FolderKanban, LayoutDashboard, ListChecks, Map, Pencil, Plus, Search, Sparkles, Target, Trash2, UserRound, X } from 'lucide-react';
import { Link, Redirect, Route, Router as WouterRouter, Switch, useLocation } from 'wouter';
import * as api from './lib/api';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
if (!clerkPubKey) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');

const appearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside',
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#23635d',
    colorForeground: '#172529',
    colorMutedForeground: '#536467',
    colorDanger: '#a44834',
    colorBackground: '#fffdf8',
    colorInput: '#f6f4ee',
    colorInputForeground: '#172529',
    colorNeutral: '#d9ddd6',
    fontFamily: 'DM Sans, sans-serif',
    borderRadius: '0.6rem',
  },
};

const nav = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/skills', label: 'Skills', icon: Sparkles },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/applications', label: 'Applications', icon: BriefcaseBusiness },
  { href: '/interviews', label: 'Interview prep', icon: ListChecks },
  { href: '/roadmaps', label: 'Roadmaps', icon: Map },
  { href: '/profile', label: 'Profile', icon: UserRound },
];

const initials = (name = 'You') => name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'Y';
const formatDate = (value) => value ? new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value)) : '—';
const normalizeList = (value) => Array.isArray(value) ? value : [];

function Brand() {
  return <Link href="/" className="brand" data-testid="link-brand"><span className="brand-mark" aria-hidden="true" />SkillSync</Link>;
}

function Landing() {
  const { isLoaded, isSignedIn } = useAuth();
  const [, setLocation] = useLocation();
  useEffect(() => { if (isLoaded && isSignedIn) setLocation('/dashboard'); }, [isLoaded, isSignedIn, setLocation]);
  if (!isLoaded) return <div className="landing" />;
  return (
    <div className="landing app-noise">
      <nav className="landing-nav">
        <Brand />
        <div className="landing-links">
          <a href="#why">Why SkillSync</a>
          <a href="#method">The method</a>
          <Link href="/sign-in" className="outline-link" data-testid="link-landing-sign-in">Sign in</Link>
        </div>
      </nav>
      <main className="landing-main">
        <section className="hero">
          <div className="rise">
            <div className="eyebrow">A private career workspace</div>
            <h1>Your next move, <em>in focus.</em></h1>
            <p className="hero-copy">Keep the signal close. SkillSync brings your skills, proof of work, applications, and preparation into one quietly useful place.</p>
            <div className="hero-actions">
              <Link href="/sign-up" className="button button-primary" data-testid="link-landing-sign-up">Start shaping your move <ChevronRight size={15} /></Link>
              <a href="#why" className="button button-quiet" data-testid="link-landing-learn">See how it works</a>
            </div>
          </div>
          <div className="hero-art rise" style={{ animationDelay: '.1s' }} aria-label="A visual representation of connected career signals">
            <div className="orbit"><div className="art-core" /><div className="art-dot one" /><div className="art-dot two" /><div className="art-label">YOUR SIGNALS / 01</div></div>
          </div>
        </section>
        <div className="marquee"><span>SKILLS WITH CONTEXT</span><span>PROJECTS WITH PROOF</span><span>APPLICATIONS WITH A MEMORY</span><span>A PLAN THAT MOVES</span><span>SKILLS WITH CONTEXT</span></div>
        <section className="landing-section" id="why">
          <div className="section-kicker"><span>01</span><b>Why SkillSync</b></div>
          <h2 className="section-title">Not another place to lose track of yourself.</h2>
          <div className="value-grid">
            <article className="value-card"><span className="value-number">01 / SEE IT</span><h3>The whole picture.</h3><p>Make your experience legible to yourself before you make it legible to anyone else.</p></article>
            <article className="value-card"><span className="value-number">02 / BUILD IT</span><h3>Proof over promises.</h3><p>Keep the projects and skills that make your next chapter credible, close at hand.</p></article>
            <article className="value-card"><span className="value-number">03 / MOVE IT</span><h3>Progress with a pulse.</h3><p>Turn a vague direction into a few next actions you can actually take this week.</p></article>
          </div>
        </section>
        <section className="landing-section" id="method" style={{ paddingTop: 0 }}>
          <div className="section-kicker"><span>02</span><b>The method</b></div>
          <h2 className="section-title">A small, considered space for a big transition.</h2>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'18px' }}>
            <div className="panel" style={{ padding:'28px', background:'var(--lavender)', boxShadow:'none' }}><span className="mono small">01 — COLLECT</span><h3 className="serif" style={{ fontSize:35, margin:'54px 0 0' }}>Name what you know.</h3></div>
            <div className="panel" style={{ padding:'28px', background:'var(--yellow)', boxShadow:'none' }}><span className="mono small">02 — COMMIT</span><h3 className="serif" style={{ fontSize:35, margin:'54px 0 0' }}>Choose where to go next.</h3></div>
          </div>
        </section>
        <footer className="landing-footer"><span>© SkillSync — your work, your direction.</span><span className="mono">PRIVATE BY DEFAULT</span></footer>
      </main>
    </div>
  );
}

function SignInPage() {
  return <div className="auth-page"><div className="auth-brand"><Brand /><p>Make your next move legible.</p></div><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></div>;
}
function SignUpPage() {
  return <div className="auth-page"><div className="auth-brand"><Brand /><p>A private place to shape what comes next.</p></div><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></div>;
}

function Sidebar({ user }) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  return <aside className="sidebar">
    <Brand />
    <div className="nav-label">Workspace</div>
    <nav className="side-nav">{nav.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={location === href ? 'active' : ''} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}><Icon size={16} /><span>{label}</span></Link>)}</nav>
    <div className="sidebar-bottom">
      <div className="profile-mini"><div className="avatar">{user?.imageUrl ? <img src={user.imageUrl} alt="" /> : initials(user?.fullName || user?.firstName)}</div><div><strong>{user?.fullName || user?.firstName || 'Your profile'}</strong><span>{user?.primaryEmailAddress?.emailAddress || 'Personal workspace'}</span></div></div>
      <button className="signout" type="button" onClick={() => signOut({ redirectUrl: basePath || '/' })} data-testid="button-sign-out">Sign out</button>
    </div>
  </aside>;
}

function MobileNav() {
  const [location] = useLocation();
  return <nav className="mobile-nav">{nav.slice(0, 5).map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={location === href ? 'active' : ''} data-testid={`link-mobile-${label}`}><Icon size={17} /><span>{label}</span></Link>)}</nav>;
}

function AppShell({ children }) {
  const { user } = useUser();
  const [notifications, setNotifications] = useState([]);
  const [noticeOpen, setNoticeOpen] = useState(false);
  useEffect(() => { api.getNotifications().then(setNotifications).catch(() => {}); }, []);
  return <div className="shell app-noise"><Sidebar user={user} /><main className="main"><header className="topbar"><div className="topbar-title">Your workspace</div><div className="topbar-right"><button className="icon-button" type="button" onClick={() => setNoticeOpen((open) => !open)} data-testid="button-notifications"><Bell size={16} />{notifications.some((n) => !n.read) && <span className="notification-dot" />}</button><div className="avatar">{user?.imageUrl ? <img src={user.imageUrl} alt="" /> : initials(user?.fullName || user?.firstName)}</div></div></header>{noticeOpen && <NotificationPopover notifications={notifications} onClose={() => setNoticeOpen(false)} />}{children}</main><MobileNav /></div>;
}

function NotificationPopover({ notifications, onClose }) {
  return <div style={{ position:'fixed', zIndex:25, right:28, top:64, width:320 }} className="panel"><div className="panel-head"><span className="panel-title">Notifications</span><button className="close" onClick={onClose} type="button"><X size={15} /></button></div>{notifications.length ? notifications.slice(0, 5).map((n) => <div key={n._id || n.id} style={{ padding:'14px 18px', borderBottom:'1px solid var(--line)', fontSize:12 }}><span className={n.read ? 'muted' : ''}>{n.message}</span><div className="mono" style={{ fontSize:9, color:'#899694', marginTop:5 }}>{formatDate(n.createdAt)}</div></div>) : <div className="empty"><div className="empty-icon"><Bell size={16} /></div><h3>Nothing new</h3><p>Updates will appear here as your workspace changes.</p></div>}</div>;
}

function Protected({ children }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <div className="landing" />;
  if (!isSignedIn) return <Redirect to="/sign-in" />;
  return <AppShell>{children}</AppShell>;
}

function PageLoading() {
  return <div className="content"><div className="skeleton" style={{ height:42, width:290, marginBottom:30 }} /><div className="skeleton" style={{ height:185, width:'100%', marginBottom:18 }} /><div className="skeleton" style={{ height:270, width:'100%' }} /></div>;
}
function ErrorState({ error, retry }) {
  return <div className="panel empty"><div className="empty-icon"><X size={17} /></div><h3>Couldn’t load this yet.</h3><p>{error?.message || 'The workspace did not respond. Your data is safe.'}</p><button className="button button-primary" type="button" onClick={retry} data-testid="button-retry">Try again</button></div>;
}
function EmptyState({ icon: Icon = Sparkles, title, copy, action, onAction }) {
  return <div className="empty"><div className="empty-icon"><Icon size={17} /></div><h3>{title}</h3><p>{copy}</p>{action && <button className="button button-primary" type="button" onClick={onAction} data-testid="button-empty-action"><Plus size={14} /> {action}</button>}</div>;
}

function Dashboard() {
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const load = () => { setError(null); api.getDashboard().then(setData).catch(setError); };
  useEffect(load, []);
  if (!data && !error) return <PageLoading />;
  if (error) return <div className="content"><ErrorState error={error} retry={load} /></div>;
  const counts = data.counts || {};
  const statuses = data.applicationStatuses || {};
  const totalApps = Object.values(statuses).reduce((sum, count) => sum + Number(count || 0), 0);
  const completion = Number(data.profileCompletion || 0);
  return <div className="content page-enter">
    <div className="welcome"><div><div className="eyebrow">Good to see you</div><h1>{user?.firstName || 'Your'}<br /><span className="muted">next chapter starts here.</span></h1><p className="muted small">A clear view of what you’re building and where it’s heading.</p></div><Link href="/profile" className="button button-primary" data-testid="link-dashboard-profile"><CircleUserRound size={15} /> Finish your profile</Link></div>
    <div className="dashboard-grid"><section className="panel"><div className="panel-head"><span className="panel-title">Your signal at a glance</span><span className="panel-note">LIVE SNAPSHOT</span></div><div className="stats"><div className="stat"><div className="stat-value">{counts.skills || 0}</div><div className="stat-label">Skills mapped</div></div><div className="stat"><div className="stat-value">{counts.projects || 0}</div><div className="stat-label">Projects captured</div></div><div className="stat"><div className="stat-value">{counts.activeRoadmaps || 0}</div><div className="stat-label">Active roadmaps</div></div></div><div className="status-bars"><div className="panel-title">Application rhythm <span className="panel-note"> / {totalApps} total</span></div>{['applied','screening','interview','offer'].map((status) => <div className="status-row" key={status}><span style={{ textTransform:'capitalize' }}>{status}</span><div className="bar"><span className={status} style={{ width: totalApps ? `${Math.max(5, (Number(statuses[status] || 0) / totalApps) * 100)}%` : '0%' }} /></div><span className="mono small">{statuses[status] || 0}</span></div>)}</div></section><section className="completion" style={{ '--completion': `${completion}%` }}><span className="mono small">PROFILE SIGNAL</span><div className="completion-ring"><strong>{completion}%</strong></div><h3>Make the first impression count.</h3><p>A little more context helps you see the story your experience is already telling.</p><Link href="/profile" className="button completion-link" data-testid="link-completion-profile">Complete profile <ChevronRight size={14} /></Link></section></div>
    <div className="dashboard-lower"><section className="panel"><div className="panel-head"><span className="panel-title">Recent movement</span><Link href="/applications" className="linkish" data-testid="link-dashboard-applications">View applications</Link></div>{normalizeList(data.recentActivity).length ? <div className="activity-list">{normalizeList(data.recentActivity).slice(0, 5).map((item, index) => <div className="activity-item" key={item.id || item._id || index}><div className="activity-icon"><Check size={15} /></div><div className="activity-body"><strong>{item.message || item.title || 'Workspace updated'}</strong><span className="activity-time">{formatDate(item.createdAt || item.updatedAt)}</span></div></div>)}</div> : <EmptyState icon={Target} title="Your story starts here." copy="Add a skill, project, or application and your movement will show up here." action="Add a skill" onAction={() => setLocation('/skills')} />}</section><section className="panel"><div className="panel-head"><span className="panel-title">Roadmaps in motion</span><Link href="/roadmaps" className="linkish" data-testid="link-dashboard-roadmaps">See all</Link></div>{normalizeList(data.roadmaps || data.activeRoadmapsList).length ? <div className="roadmap-list">{normalizeList(data.roadmaps || data.activeRoadmapsList).slice(0, 3).map((roadmap, index) => <RoadmapPreview key={roadmap.id || roadmap._id || index} roadmap={roadmap} />)}</div> : <EmptyState icon={Map} title="Give a direction a name." copy="Roadmaps turn a broad ambition into a sequence of small, visible steps." action="Create a roadmap" onAction={() => setLocation('/roadmaps')} />}</section></div>
  </div>;
}

function RoadmapPreview({ roadmap }) {
  const milestones = normalizeList(roadmap.milestones);
  const done = milestones.filter((m) => m.done).length;
  const percent = milestones.length ? (done / milestones.length) * 100 : 0;
  return <div className="roadmap-item"><div className="roadmap-top"><span className="roadmap-name">{roadmap.name}</span><span className={roadmap.active ? 'pill' : 'pill yellow'}>{roadmap.active ? 'Active' : 'Paused'}</span></div><div className="roadmap-track"><span style={{ width:`${percent}%` }} /></div><span className="activity-time">{done} of {milestones.length} milestones complete</span></div>;
}

const configs = {
  skills: { title:'Skills', kicker:'Your working vocabulary', copy:'Keep a living record of the capabilities you want to carry forward.', icon:Sparkles, empty:'No skills mapped yet.', emptyCopy:'Start with the skills you use often, then give each one a little context.', resource:'skills', get:api.getSkills, add:api.createSkill, edit:api.updateSkill, del:api.deleteSkill, fields:[['name','Skill name','text'],['category','Category','text'],['proficiency','Proficiency','select',['beginner','working','advanced','expert']],['experience','Experience','text']], primary:'name', secondary:'category', third:'proficiency'},
  projects: { title:'Projects', kicker:'Proof of work', copy:'The work that makes your experience concrete and memorable.', icon:FolderKanban, empty:'No projects captured yet.', emptyCopy:'Add the projects that show how you think, make, and finish.', resource:'projects', get:api.getProjects, add:api.createProject, edit:api.updateProject, del:api.deleteProject, fields:[['name','Project name','text'],['description','Short description','textarea'],['technologies','Technologies','text','comma'],['demoUrl','Live demo URL','url'],['repositoryUrl','Repository URL','url']], primary:'name', secondary:'description', third:'technologies'},
  applications: { title:'Applications', kicker:'Your search, with a memory', copy:'A calm place to keep every thread, not just the open ones.', icon:BriefcaseBusiness, empty:'No applications yet.', emptyCopy:'When you apply, capture the context here so the follow-up is never a scramble.', resource:'applications', get:api.getApplications, add:api.createApplication, edit:api.updateApplication, del:api.deleteApplication, fields:[['company','Company','text'],['role','Role','text'],['location','Location','text'],['status','Status','select',['applied','screening','interview','offer','rejected']],['appliedAt','Applied on','date'],['jobUrl','Job URL','url'],['notes','Notes','textarea']], primary:'company', secondary:'role', third:'status'},
  interviews: { title:'Interview prep', kicker:'Your thinking, sharpened', copy:'Keep your preparation close enough to revisit and specific enough to help.', icon:ListChecks, empty:'No topics ready yet.', emptyCopy:'Capture the questions and ideas you want to be able to answer with ease.', resource:'interview-topics', get:api.getInterviewTopics, add:api.createInterviewTopic, edit:api.updateInterviewTopic, del:api.deleteInterviewTopic, fields:[['topic','Topic','text'],['progress','Progress','select',['not-started','in-progress','ready']],['notes','Notes','textarea']], primary:'topic', secondary:'notes', third:'progress'},
  roadmaps: { title:'Roadmaps', kicker:'A direction with next steps', copy:'Make a possible future feel closer by giving it an order.', icon:Map, empty:'No roadmaps yet.', emptyCopy:'Name a direction, then turn it into milestones you can actually see.', resource:'roadmaps', get:api.getRoadmaps, add:api.createRoadmap, edit:api.updateRoadmap, del:api.deleteRoadmap, fields:[['name','Roadmap name','text'],['goal','Goal','text'],['description','Description','textarea'],['active','Active','checkbox'],['milestones','Milestones','milestones']], primary:'name', secondary:'goal', third:'active'},
};

function CollectionPage({ type }) {
  const config = configs[type];
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const load = () => { setLoading(true); setError(null); config.get().then((result) => setRecords(Array.isArray(result) ? result : result?.items || result?.data || [])).catch(setError).finally(() => setLoading(false)); };
  useEffect(load, [type]);
  const visible = useMemo(() => records.filter((record) => JSON.stringify(record).toLowerCase().includes(query.toLowerCase())), [records, query]);
  const openNew = () => setModal({ record:null });
  const openEdit = (record) => setModal({ record });
  const save = async (data) => { setSaving(true); try { const result = modal.record ? await config.edit(modal.record._id || modal.record.id, data) : await config.add(data); setRecords((current) => modal.record ? current.map((item) => (item._id || item.id) === (modal.record._id || modal.record.id) ? (result || { ...modal.record, ...data }) : item) : [...current, result || data]); setModal(null); } catch (saveError) { setError(saveError); } finally { setSaving(false); } };
  const remove = async (record) => { if (!window.confirm(`Delete ${record[config.primary] || 'this record'}?`)) return; try { await config.del(record._id || record.id); setRecords((current) => current.filter((item) => (item._id || item.id) !== (record._id || record.id))); } catch (deleteError) { setError(deleteError); } };
  if (loading) return <PageLoading />;
  return <div className="content page-enter"><div className="list-header"><div><div className="eyebrow">{config.kicker}</div><h1>{config.title}</h1><p className="muted small">{config.copy}</p></div><button className="button button-primary" type="button" onClick={openNew} data-testid={`button-add-${type}`}><Plus size={15} /> Add {type === 'interviews' ? 'topic' : type === 'roadmaps' ? 'roadmap' : type.slice(0, -1)}</button></div><div className="toolbar"><div className="search"><Search size={15} /><input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${config.title.toLowerCase()}`} data-testid={`input-search-${type}`} /></div>{type === 'applications' && <select className="select" style={{ maxWidth:190 }} onChange={(event) => setQuery(event.target.value)} data-testid="select-application-status"><option value="">All statuses</option>{configs.applications.fields[3][3].map((status) => <option key={status} value={status}>{status}</option>)}</select>}</div>{error && <div style={{ marginBottom:16 }}><ErrorState error={error} retry={load} /></div>}<section className="panel table-panel">{visible.length ? <div className="record-list">{visible.map((record, index) => <RecordRow key={record._id || record.id || index} record={record} config={config} onEdit={() => openEdit(record)} onDelete={() => remove(record)} />)}</div> : <EmptyState icon={config.icon} title={query ? 'Nothing matches that search.' : config.empty} copy={query ? 'Try a different word or clear your search.' : config.emptyCopy} action={!query ? `Add ${type === 'interviews' ? 'topic' : type === 'roadmaps' ? 'roadmap' : type.slice(0, -1)}` : null} onAction={openNew} />}</section>{modal && <RecordModal config={config} initial={modal.record} saving={saving} onClose={() => setModal(null)} onSave={save} />}</div>;
}

function RecordRow({ record, config, onEdit, onDelete }) {
  const primary = record[config.primary] || 'Untitled';
  const secondary = record[config.secondary];
  const third = record[config.third];
  const isArray = Array.isArray(third);
  return <div className="record"><div className="record-main"><strong>{primary}</strong><span>{secondary || 'No context added yet.'}</span></div><div>{isArray ? <div className="tag-wrap">{third.slice(0, 4).map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div> : <span className={`pill ${third === 'rejected' ? 'coral' : third === 'offer' || third === 'ready' ? 'yellow' : ''}`}>{third === true ? 'Active' : third === false ? 'Paused' : String(third || 'Not set').replaceAll('-', ' ')}</span>}</div><div>{config.resource === 'applications' ? <span className="record-copy">{formatDate(record.appliedAt)}</span> : config.resource === 'roadmaps' ? <span className="record-copy">{normalizeList(record.milestones).filter((m) => m.done).length}/{normalizeList(record.milestones).length} milestones</span> : <span className="record-label">{config.resource === 'skills' ? 'experience' : config.resource === 'projects' ? 'portfolio piece' : 'ready when you are'}</span>}</div><div className="record-actions"><button className="row-action" type="button" onClick={onEdit} aria-label="Edit record" data-testid={`button-edit-${config.resource}-${record._id || record.id}`}><Pencil size={14} /></button><button className="row-action delete" type="button" onClick={onDelete} aria-label="Delete record" data-testid={`button-delete-${config.resource}-${record._id || record.id}`}><Trash2 size={14} /></button></div></div>;
}

function RecordModal({ config, initial, saving, onClose, onSave }) {
  const [form, setForm] = useState(() =>
    config.fields.reduce((result, [key, , kind, mode]) => {
      const current = initial?.[key];

      result[key] =
        kind === 'checkbox'
          ? Boolean(current)
          : mode === 'comma'
            ? (Array.isArray(current) ? current.join(', ') : current || '')
            : kind === 'milestones'
              ? (Array.isArray(current) ? current : [])
              : current ?? (kind === 'select' ? '' : '');

      return result;
    }, {})
  );

  const set = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const submit = (event) => {
    event.preventDefault();

    const data = { ...form };

    config.fields.forEach(([key, , kind, mode]) => {
      if (mode === 'comma') {
        data[key] = String(data[key] || '')
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean);
      }

      if (kind === 'checkbox') {
        data[key] = Boolean(data[key]);
      }
    });

    onSave(data);
  };

  return (
    <div className="modal-backdrop">
      <form className="modal" onSubmit={submit}>
        <div className="modal-head">
          <h2>
            {initial
              ? 'Edit record'
              : `Add ${
                  config.title === 'Interview prep'
                    ? 'a topic'
                    : config.title.endsWith('s')
                      ? config.title.slice(0, -1).toLowerCase()
                      : config.title.toLowerCase()
                }`}
          </h2>

          <button
            type="button"
            className="close"
            onClick={onClose}
            data-testid="button-close-modal"
          >
            <X size={17} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-grid">
            {config.fields.map(([key, label, kind, mode]) => {
              const fieldOptions =
                kind === 'select' && Array.isArray(mode) ? mode : [];

              return (
                <div
                  className={`field ${
                    kind === 'textarea' || kind === 'milestones'
                      ? 'full'
                      : ''
                  }`}
                  key={key}
                >
                  {kind === 'checkbox' ? (
                    <label
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        gap: 9,
                        alignItems: 'center',
                        textTransform: 'none',
                        fontFamily: 'var(--font-sans)',
                        fontSize: 13,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(form[key])}
                        onChange={(event) =>
                          set(key, event.target.checked)
                        }
                        data-testid={`input-${key}`}
                      />
                      {label}
                    </label>
                  ) : (
                    <>
                      <label htmlFor={`field-${key}`}>
                        {label}
                      </label>

                      {kind === 'textarea' ? (
                        <textarea
                          id={`field-${key}`}
                          className="textarea"
                          value={form[key] || ''}
                          onChange={(event) =>
                            set(key, event.target.value)
                          }
                          data-testid={`input-${key}`}
                        />
                      ) : kind === 'select' ? (
                        <select
                          id={`field-${key}`}
                          className="select"
                          value={form[key] || ''}
                          onChange={(event) =>
                            set(key, event.target.value)
                          }
                          data-testid={`input-${key}`}
                        >
                          {fieldOptions.map((option) => (
                            <option value={option} key={option}>
                              {option.replaceAll('-', ' ')}
                            </option>
                          ))}
                        </select>
                      ) : kind === 'milestones' ? (
                        <MilestoneEditor
                          value={form[key]}
                          onChange={(value) => set(key, value)}
                        />
                      ) : (
                        <input
                          id={`field-${key}`}
                          className="input"
                          type={kind}
                          value={form[key] || ''}
                          onChange={(event) =>
                            set(key, event.target.value)
                          }
                          placeholder={
                            mode === 'comma'
                              ? 'Example: writing, research, facilitation'
                              : ''
                          }
                          data-testid={`input-${key}`}
                        />
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="button button-quiet"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="button button-primary"
              disabled={saving}
              data-testid="button-save-record"
            >
              {saving ? 'Saving…' : 'Save record'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function MilestoneEditor({ value, onChange }) {
  const add = () => onChange([...(value || []), { title:'', done:false }]);
  const update = (index, patch) => onChange(value.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  return <div><div style={{ display:'flex', flexDirection:'column', gap:8 }}>{(value || []).map((milestone, index) => <div key={index} style={{ display:'flex', gap:8, alignItems:'center' }}><input className="input" value={milestone.title} onChange={(event) => update(index, { title:event.target.value })} placeholder={`Milestone ${index + 1}`} data-testid={`input-milestone-${index}`} /><input type="checkbox" checked={Boolean(milestone.done)} onChange={(event) => update(index, { done:event.target.checked })} aria-label="Milestone complete" /></div>)}</div><button className="button button-quiet" type="button" onClick={add} style={{ paddingLeft:0, marginTop:8 }}><Plus size={14} /> Add milestone</button></div>;
}

function TagEditor({ value, onChange, placeholder }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const next = draft.trim();
    if (next && !value.includes(next)) onChange([...value, next]);
    setDraft('');
  };
  return <div><div className="tag-wrap" style={{ marginBottom:8 }}>{value.map((item) => <span className="tag" key={item} style={{ display:'inline-flex', alignItems:'center', gap:5 }}>{item}<button type="button" onClick={() => onChange(value.filter((entry) => entry !== item))} style={{ border:0, background:'none', padding:0, color:'inherit', display:'grid' }} aria-label={`Remove ${item}`} data-testid={`button-remove-tag-${item}`}><X size={11} /></button></span>)}</div><div style={{ display:'flex', gap:8 }}><input className="input" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); add(); } }} placeholder={placeholder} data-testid={`input-add-${placeholder}`} /><button type="button" className="button button-quiet" onClick={add} data-testid={`button-add-${placeholder}`}><Plus size={14} /> Add</button></div></div>;
}

const emptyProfile = { fullName:'', photoUrl:'', email:'', phone:'', location:'', education:{ degree:'', university:'', graduationYear:'', cgpa:'' }, professional:{ summary:'', careerGoal:'', preferredRoles:[], preferredLocations:[] }, social:{ github:'', linkedin:'', portfolio:'' } };
function Profile() {
  const [profile, setProfile] = useState(emptyProfile);
  const [draft, setDraft] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const load = () => { setLoading(true); api.getProfile().then((result) => { const next = { ...emptyProfile, ...result, education:{ ...emptyProfile.education, ...(result?.education || {}) }, professional:{ ...emptyProfile.professional, ...(result?.professional || {}) }, social:{ ...emptyProfile.social, ...(result?.social || {}) } }; setProfile(next); setDraft(next); }).catch(setError).finally(() => setLoading(false)); };
  useEffect(load, []);
  const update = (section, key, value) => setDraft((current) => section ? { ...current, [section]: { ...current[section], [key]: value } } : { ...current, [key]:value });
  const save = async (event) => { event.preventDefault(); setSaving(true); setSaved(false); try { const result = await api.updateProfile(draft); const next = { ...draft, ...(result || {}) }; setProfile(next); setDraft(next); setSaved(true); setTimeout(() => setSaved(false), 2800); } catch (saveError) { setError(saveError); } finally { setSaving(false); } };
  if (loading) return <PageLoading />;
  if (error && !profile.fullName) return <div className="content"><ErrorState error={error} retry={load} /></div>;
  return <div className="content page-enter"><div className="list-header"><div><div className="eyebrow">The person behind the work</div><h1>Your profile</h1><p className="muted small">A little context makes every other part of SkillSync more useful.</p></div></div><form onSubmit={save}><div className="profile-grid"><section className="panel profile-card"><h2><span>01 / Personal</span>Start with the basics.</h2><div className="form-grid">{[['fullName','Full name'],['email','Email'],['phone','Phone'],['location','Location'],['photoUrl','Photo URL']].map(([key,label]) => <div className="field" key={key}><label htmlFor={`profile-${key}`}>{label}</label><input className="input" id={`profile-${key}`} value={draft[key] || ''} onChange={(event) => update(null,key,event.target.value)} data-testid={`input-profile-${key}`} /></div>)}</div></section><section className="panel profile-card"><h2><span>02 / Education</span>Where you learned.</h2><div className="form-grid">{[['degree','Degree'],['university','University'],['graduationYear','Graduation year'],['cgpa','CGPA']].map(([key,label]) => <div className="field" key={key}><label htmlFor={`education-${key}`}>{label}</label><input className="input" id={`education-${key}`} value={draft.education[key] || ''} onChange={(event) => update('education',key,event.target.value)} data-testid={`input-education-${key}`} /></div>)}</div></section><section className="panel profile-card wide"><h2><span>03 / Professional</span>Where you’re going.</h2><div className="form-grid"><div className="field full"><label htmlFor="profile-summary">Professional summary</label><textarea className="textarea" id="profile-summary" value={draft.professional.summary || ''} onChange={(event) => update('professional','summary',event.target.value)} data-testid="input-profile-summary" /></div><div className="field full"><label htmlFor="profile-goal">Career goal</label><input className="input" id="profile-goal" value={draft.professional.careerGoal || ''} onChange={(event) => update('professional','careerGoal',event.target.value)} data-testid="input-profile-goal" /></div><div className="field"><label>Preferred roles</label><TagEditor value={normalizeList(draft.professional.preferredRoles)} onChange={(value) => update('professional','preferredRoles',value)} placeholder="Add a role" /></div><div className="field"><label>Preferred locations</label><TagEditor value={normalizeList(draft.professional.preferredLocations)} onChange={(value) => update('professional','preferredLocations',value)} placeholder="Add a location" /></div></div></section><section className="panel profile-card wide"><h2><span>04 / Social</span>Leave a trail.</h2><div className="form-grid">{[['github','GitHub'],['linkedin','LinkedIn'],['portfolio','Portfolio']].map(([key,label]) => <div className="field" key={key}><label htmlFor={`social-${key}`}>{label}</label><input className="input" id={`social-${key}`} value={draft.social[key] || ''} onChange={(event) => update('social',key,event.target.value)} data-testid={`input-social-${key}`} /></div>)}</div></section></div><div className="profile-actions">{error && <span className="save-state" style={{ color:'#a44834' }}>{error.message}</span>}{saved && <span className="save-state"><Check size={13} /> Saved just now</span>}<button type="button" className="button button-quiet" onClick={() => setDraft(profile)} data-testid="button-cancel-profile">Cancel changes</button><button type="submit" className="button button-primary" disabled={saving} data-testid="button-save-profile">{saving ? 'Saving…' : 'Save profile'}</button></div></form></div>;
}

function Router() {
  const [, setLocation] = useLocation();
  return <Switch><Route path="/" component={Landing} /><Route path="/sign-in/*?" component={SignInPage} /><Route path="/sign-up/*?" component={SignUpPage} /><Route path="/dashboard"><Protected><Dashboard /></Protected></Route><Route path="/profile"><Protected><Profile /></Protected></Route>{Object.keys(configs).map((type) => <Route key={type} path={`/${type}`}><Protected><CollectionPage type={type} /></Protected></Route>)}<Route><div className="content"><EmptyState icon={X} title="Page not found" copy="This corner of SkillSync does not exist." action="Back to overview" onAction={() => setLocation('/dashboard')} /></div></Route></Switch>;
}

function ClerkRoutes() {
  const [, setLocation] = useLocation();
  const stripBase = (path) => basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;
  return <ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={appearance} signInUrl={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} localization={{ signIn:{ start:{ title:'Welcome back', subtitle:'Your next move is waiting.' } }, signUp:{ start:{ title:'Create your workspace', subtitle:'A private place to shape what comes next.' } } }} routerPush={(to) => setLocation(stripBase(to))} routerReplace={(to) => setLocation(stripBase(to), { replace:true })}><Router /></ClerkProvider>;
}

function App() {
  return <WouterRouter base={basePath}><ClerkRoutes /></WouterRouter>;
}

export default App;
