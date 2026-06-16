import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";

type UserRole = "client" | "organizer" | "admin";
type AuthUser = { id: string; phone: string; role: UserRole; status: string; profile?: { nickname?: string | null } | null };
type AuthPayload = { user: AuthUser; accessToken: string; refreshToken: string };
type ApiResponse<T> = { code: number; message: string; data: T; requestId: string };
type AuthState = { token: string; user: AuthUser };
type JsonRecord = Record<string, unknown>;

const API_BASE = "http://127.0.0.1:3000/api/v1";
const AUTH_STORAGE_KEY = "storage-helper-admin-auth";

function readStoredAuth(): AuthState | null {
  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthState;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

async function requestJson<T>(path: string, init: RequestInit, token?: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {})
    }
  });
  const payload = (await response.json()) as ApiResponse<T> | { message?: string };
  if (!response.ok || !("data" in payload)) {
    throw new Error(payload.message ?? "Request failed");
  }
  return payload.data;
}

function AuthPanel({
  title,
  subtitle,
  actionLabel,
  children
}: {
  title: string;
  subtitle: string;
  actionLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="auth-screen">
      <section className="auth-panel auth-panel-brand">
        <div>
          <p className="eyebrow">Storage Helper</p>
          <h1>Phase 3 Admin Console</h1>
          <p className="auth-copy">
            Review service contracts, escrow records, refunds, breach records, and transaction ledger in one console.
          </p>
        </div>
        <div className="auth-highlights">
          <span>Service Contracts</span>
          <span>Escrow Payments</span>
          <span>Refund Workflow</span>
          <span>Risk Center</span>
        </div>
      </section>
      <section className="auth-panel">
        <div className="auth-header">
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        {children}
        <p className="auth-switch">{actionLabel}</p>
      </section>
    </div>
  );
}

function LoginPage({ onAuthenticated }: { onAuthenticated: (payload: AuthPayload) => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [phone, setPhone] = useState("13800000000");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const payload = await requestJson<AuthPayload>("/auth/password-login", {
        method: "POST",
        body: JSON.stringify({ phone, password })
      });
      onAuthenticated(payload);
      const redirectTo = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
      navigate(redirectTo || "/", { replace: true });
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Login failed");
    }
  }

  return (
    <AuthPanel title="Login" subtitle="Sign in with an admin account." actionLabel="Use /register if the admin account does not exist yet.">
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          <span>Phone</span>
          <input value={phone} onChange={(event) => setPhone(event.target.value)} />
        </label>
        <label>
          <span>Password</span>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button className="primary-button" type="submit">
          Login
        </button>
      </form>
    </AuthPanel>
  );
}

function RegisterPage({ onAuthenticated }: { onAuthenticated: (payload: AuthPayload) => void }) {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("13800000000");
  const [nickname, setNickname] = useState("Admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const payload = await requestJson<AuthPayload>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ phone, password, nickname, role: "admin" })
      });
      onAuthenticated(payload);
      navigate("/", { replace: true });
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Register failed");
    }
  }

  return (
    <AuthPanel title="Register" subtitle="Create an admin account without changing the existing auth flow." actionLabel="After registration, the console signs in automatically.">
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>
          <span>Phone</span>
          <input value={phone} onChange={(event) => setPhone(event.target.value)} />
        </label>
        <label>
          <span>Nickname</span>
          <input value={nickname} onChange={(event) => setNickname(event.target.value)} />
        </label>
        <label>
          <span>Password</span>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button className="primary-button" type="submit">
          Register
        </button>
      </form>
    </AuthPanel>
  );
}

function Dashboard({ auth }: { auth: AuthState }) {
  const [overview, setOverview] = useState<JsonRecord | null>(null);
  const [finance, setFinance] = useState<JsonRecord | null>(null);
  const [risk, setRisk] = useState<JsonRecord | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      requestJson<JsonRecord>("/admin/dashboard/overview", { method: "GET" }, auth.token),
      requestJson<JsonRecord>("/admin/finance/summary", { method: "GET" }, auth.token),
      requestJson<JsonRecord>("/admin/risk-center/summary", { method: "GET" }, auth.token)
    ])
      .then(([overviewData, financeData, riskData]) => {
        setOverview(overviewData);
        setFinance(financeData);
        setRisk(riskData);
      })
      .catch((exception) => setError(exception instanceof Error ? exception.message : "Failed to load dashboard"));
  }, [auth.token]);

  return (
    <div className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">Storage Helper</p>
          <h1>Phase 3 Finance And Risk Overview</h1>
          <p className="hero-copy">This dashboard validates escrow, refund, breach, and ledger flows without changing existing order behavior.</p>
        </div>
        <div className="hero-side">
          <span className="hero-label">Current Scope</span>
          <strong>Safety And Trust Center</strong>
        </div>
      </section>
      {error ? <p className="form-error">{error}</p> : null}
      <section className="stats-grid">
        <article className="stat-card">
          <span className="stat-label">Total Users</span>
          <strong className="stat-value">{String(overview?.totalUsers ?? 0)}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">Active Users</span>
          <strong className="stat-value">{String(overview?.activeUsers ?? 0)}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">Orders</span>
          <strong className="stat-value">{String(overview?.orders ?? 0)}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">GMV</span>
          <strong className="stat-value">{String(overview?.gmv ?? 0)}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">Refund Rate</span>
          <strong className="stat-value">{String(overview?.refundRate ?? 0)}%</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">Complaint Rate</span>
          <strong className="stat-value">{String(overview?.complaintRate ?? 0)}%</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">Holding Escrow</span>
          <strong className="stat-value">{String(finance?.totalEscrow ?? 0)}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">Organizers</span>
          <strong className="stat-value">{String(overview?.organizerCount ?? 0)}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">SOS Events</span>
          <strong className="stat-value">{String(risk?.sosCount ?? overview?.sosEvents ?? 0)}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">Disputes</span>
          <strong className="stat-value">{String(risk?.complaintCount ?? overview?.disputes ?? 0)}</strong>
        </article>
      </section>
    </div>
  );
}

function DataPage({
  auth,
  title,
  subtitle,
  endpoint,
  renderItem
}: {
  auth: AuthState;
  title: string;
  subtitle: string;
  endpoint: string;
  renderItem: (item: JsonRecord, index: number) => ReactNode;
}) {
  const [items, setItems] = useState<JsonRecord[]>([]);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortKey, setSortKey] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 8;

  useEffect(() => {
    requestJson<JsonRecord[] | JsonRecord>(endpoint, { method: "GET" }, auth.token)
      .then((payload) => setItems(Array.isArray(payload) ? payload : [payload]))
      .catch((exception) => setError(exception instanceof Error ? exception.message : "Load failed"));
  }, [auth.token, endpoint]);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, sortKey, sortDirection]);

  const sortableKeys = useMemo(() => {
    const first = items[0];
    if (!first) return ["createdAt"];
    return Object.keys(first).filter((key) => ["string", "number"].includes(typeof first[key]));
  }, [items]);

  const statusOptions = useMemo(() => {
    return Array.from(
      new Set(
        items
          .map((item) => item.status)
          .filter((value): value is string => typeof value === "string" && value.length > 0)
      )
    );
  }, [items]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const searched = items.filter((item) => {
      if (statusFilter !== "all" && String(item.status ?? "") !== statusFilter) {
        return false;
      }
      if (!normalizedQuery) {
        return true;
      }
      return JSON.stringify(item).toLowerCase().includes(normalizedQuery);
    });

    const direction = sortDirection === "asc" ? 1 : -1;
    return [...searched].sort((left, right) => {
      const leftValue = left[sortKey];
      const rightValue = right[sortKey];
      if (typeof leftValue === "number" && typeof rightValue === "number") {
        return (leftValue - rightValue) * direction;
      }
      return String(leftValue ?? "").localeCompare(String(rightValue ?? "")) * direction;
    });
  }, [items, query, statusFilter, sortKey, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const visibleItems = filteredItems.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="page">
      <section className="section-block">
        <div className="section-head">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {error ? <p className="form-error">{error}</p> : null}
        <div className="toolbar">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">All Status</option>
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <select value={sortKey} onChange={(event) => setSortKey(event.target.value)}>
            {sortableKeys.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
          <select value={sortDirection} onChange={(event) => setSortDirection(event.target.value as "asc" | "desc")}>
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>
        <p className="section-meta">
          {filteredItems.length} items · page {page} / {totalPages}
        </p>
        <div className="list-stack">{visibleItems.map((item, index) => renderItem(item, index))}</div>
        <div className="pager">
          <button className="ghost-button" type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
            Previous
          </button>
          <button className="ghost-button" type="button" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
            Next
          </button>
        </div>
      </section>
    </div>
  );
}

function Card({ title, lines }: { title: string; lines: string[] }) {
  return (
    <article className="module-card">
      <h3>{title}</h3>
      {lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </article>
  );
}

function ProtectedRoute({ auth, children }: { auth: AuthState | null; children: JSX.Element }) {
  const location = useLocation();
  if (!auth) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

function ShellLayout({ auth, onLogout }: { auth: AuthState; onLogout: () => void }) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <strong>Storage Helper</strong>
          <span>Admin</span>
        </div>
        <div className="session-card">
          <span className="session-label">Current User</span>
          <strong>{auth.user.profile?.nickname || auth.user.phone}</strong>
          <span className="session-meta">
            {auth.user.role} / {auth.user.phone}
          </span>
        </div>
        <nav>
          <NavLink to="/">Overview</NavLink>
          <NavLink to="/orders">Orders</NavLink>
          <NavLink to="/contracts">Contracts</NavLink>
          <NavLink to="/payments">Payments</NavLink>
          <NavLink to="/refunds">Refunds</NavLink>
          <NavLink to="/breaches">Breaches</NavLink>
          <NavLink to="/sos">SOS</NavLink>
          <NavLink to="/disputes">Disputes</NavLink>
          <NavLink to="/risk-users">Risk Users</NavLink>
          <NavLink to="/risk-organizers">Risk Organizers</NavLink>
          <NavLink to="/risk-orders">Risk Orders</NavLink>
          <NavLink to="/audit-logs">Audit Logs</NavLink>
          <NavLink to="/transactions">Transactions</NavLink>
        </nav>
        <button className="ghost-button" type="button" onClick={onLogout}>
          Logout
        </button>
      </aside>
      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard auth={auth} />} />
          <Route
            path="/orders"
            element={
              <DataPage
                auth={auth}
                title="Orders"
                subtitle="Monitor order lifecycle, escrow readiness, and dispute signals."
                endpoint="/admin/orders"
                renderItem={(item, index) => (
                  <Card
                    key={String(item.id ?? index)}
                    title={String(item.title ?? "Order")}
                    lines={[
                      `Status: ${String(item.status ?? "-")}`,
                      `Client: ${String((item.client as JsonRecord | undefined)?.phone ?? "-")}`,
                      `Organizer: ${String((item.organizer as JsonRecord | undefined)?.phone ?? "-")}`,
                      `Candidate pool expires at: ${String(item.candidatePoolExpiresAt ?? "-")}`
                    ]}
                  />
                )}
              />
            }
          />
          <Route
            path="/contracts"
            element={
              <DataPage
                auth={auth}
                title="Service Contracts"
                subtitle="Review contract snapshot, service fee, travel fee, and platform fee."
                endpoint="/admin/service-contracts"
                renderItem={(item, index) => (
                  <Card
                    key={String(item.id ?? index)}
                    title={String(item.orderId ?? "Contract")}
                    lines={[
                      `Client: ${String(item.clientId ?? "-")}`,
                      `Organizer: ${String(item.organizerId ?? "-")}`,
                      `Service fee: ${String(item.serviceFee ?? 0)}`,
                      `Platform fee: ${String(item.platformFee ?? 0)}`
                    ]}
                  />
                )}
              />
            }
          />
          <Route
            path="/payments"
            element={
              <DataPage
                auth={auth}
                title="Payments And Escrow"
                subtitle="Validate mock payment, escrow holding, and release states."
                endpoint="/admin/payments"
                renderItem={(item, index) => (
                  <Card
                    key={String(item.id ?? index)}
                    title={String(item.orderId ?? "Payment")}
                    lines={[
                      `Payer: ${String((item.payer as JsonRecord | undefined)?.phone ?? "-")}`,
                      `Amount: ${String(item.amount ?? 0)}`,
                      `Status: ${String(item.status ?? "-")}`,
                      `Provider tx: ${String(item.providerTransactionId ?? "-")}`
                    ]}
                  />
                )}
              />
            }
          />
          <Route
            path="/refunds"
            element={
              <DataPage
                auth={auth}
                title="Refunds"
                subtitle="Track pending, approved, rejected, and completed refunds."
                endpoint="/admin/refunds"
                renderItem={(item, index) => (
                  <Card
                    key={String(item.id ?? index)}
                    title={String(item.orderId ?? "Refund")}
                    lines={[
                      `Requester: ${String((item.requester as JsonRecord | undefined)?.phone ?? "-")}`,
                      `Amount: ${String(item.refundAmount ?? 0)}`,
                      `Status: ${String(item.status ?? "-")}`,
                      `Reason: ${String(item.reason ?? "-")}`
                    ]}
                  />
                )}
              />
            }
          />
          <Route
            path="/breaches"
            element={
              <DataPage
                auth={auth}
                title="Breach Records"
                subtitle="Review late cancellations, no-show handling, and deposit deductions."
                endpoint="/admin/breach-records"
                renderItem={(item, index) => (
                  <Card
                    key={String(item.id ?? index)}
                    title={String(item.orderId ?? "Breach")}
                    lines={[
                      `User: ${String((item.user as JsonRecord | undefined)?.phone ?? "-")}`,
                      `Type: ${String(item.breachType ?? "-")}`,
                      `Amount: ${String(item.amount ?? 0)}`,
                      `Status: ${String(item.status ?? "-")}`
                    ]}
                  />
                )}
              />
            }
          />
          <Route
            path="/sos"
            element={
              <DataPage
                auth={auth}
                title="SOS Events"
                subtitle="Track emergency triggers, GPS positions, and current handling status."
                endpoint="/admin/sos-events"
                renderItem={(item, index) => (
                  <Card
                    key={String(item.id ?? index)}
                    title={String((item.order as JsonRecord | undefined)?.title ?? item.orderId ?? "SOS")}
                    lines={[
                      `Triggered by: ${String((item.user as JsonRecord | undefined)?.phone ?? "-")}`,
                      `Organizer: ${String((item.organizer as JsonRecord | undefined)?.phone ?? "-")}`,
                      `Status: ${String(item.status ?? "-")}`,
                      `Location: ${String(item.latitude ?? "-")}, ${String(item.longitude ?? "-")}`
                    ]}
                  />
                )}
              />
            }
          />
          <Route
            path="/disputes"
            element={
              <DataPage
                auth={auth}
                title="Dispute Center"
                subtitle="Review disputes, messages, evidence, and final rulings."
                endpoint="/admin/disputes-center"
                renderItem={(item, index) => (
                  <Card
                    key={String(item.id ?? index)}
                    title={String(item.subject ?? "Dispute")}
                    lines={[
                      `Order: ${String((item.order as JsonRecord | undefined)?.title ?? item.orderId ?? "-")}`,
                      `Initiator: ${String((item.initiator as JsonRecord | undefined)?.phone ?? "-")}`,
                      `Respondent: ${String((item.respondent as JsonRecord | undefined)?.phone ?? "-")}`,
                      `Status: ${String(item.status ?? "-")} / Resolution: ${String(item.resolutionType ?? "-")}`
                    ]}
                  />
                )}
              />
            }
          />
          <Route
            path="/risk-users"
            element={
              <DataPage
                auth={auth}
                title="Risk Users"
                subtitle="Users with reduced safety score or banned status."
                endpoint="/admin/risk-center/users"
                renderItem={(item, index) => (
                  <Card
                    key={String(item.id ?? index)}
                    title={String((item.profile as JsonRecord | undefined)?.nickname ?? item.phone ?? "User")}
                    lines={[
                      `Phone: ${String(item.phone ?? "-")}`,
                      `Safety score: ${String(item.safetyScore ?? 100)}`,
                      `Status: ${String(item.status ?? "-")}`
                    ]}
                  />
                )}
              />
            }
          />
          <Route
            path="/risk-organizers"
            element={
              <DataPage
                auth={auth}
                title="Risk Organizers"
                subtitle="Organizers with reduced safety score or banned status."
                endpoint="/admin/risk-center/organizers"
                renderItem={(item, index) => (
                  <Card
                    key={String(item.id ?? index)}
                    title={String((item.profile as JsonRecord | undefined)?.nickname ?? item.phone ?? "Organizer")}
                    lines={[
                      `Phone: ${String(item.phone ?? "-")}`,
                      `Safety score: ${String(item.safetyScore ?? 100)}`,
                      `Status: ${String(item.status ?? "-")}`
                    ]}
                  />
                )}
              />
            }
          />
          <Route
            path="/risk-orders"
            element={
              <DataPage
                auth={auth}
                title="High Risk Orders"
                subtitle="Orders with SOS activity or disputes."
                endpoint="/admin/risk-center/orders"
                renderItem={(item, index) => (
                  <Card
                    key={String(item.id ?? index)}
                    title={String(item.title ?? "Order")}
                    lines={[
                      `Status: ${String(item.status ?? "-")}`,
                      `Client: ${String((item.client as JsonRecord | undefined)?.phone ?? "-")}`,
                      `Organizer: ${String((item.organizer as JsonRecord | undefined)?.phone ?? "-")}`,
                      `SOS count: ${String((item.sosEvents as JsonRecord[] | undefined)?.length ?? 0)} / Disputes: ${String((item.disputes as JsonRecord[] | undefined)?.length ?? 0)}`
                    ]}
                  />
                )}
              />
            }
          />
          <Route
            path="/audit-logs"
            element={
              <DataPage
                auth={auth}
                title="Audit Logs"
                subtitle="Review high-risk admin and user actions including refunds, dispute rulings, bans, and SOS handling."
                endpoint="/admin/audit-logs"
                renderItem={(item, index) => (
                  <Card
                    key={String(item.id ?? index)}
                    title={String(item.action ?? "Audit Log")}
                    lines={[
                      `Actor: ${String(((item.actor as JsonRecord | undefined)?.profile as JsonRecord | undefined)?.nickname ?? (item.actor as JsonRecord | undefined)?.phone ?? item.actorRole ?? "-")}`,
                      `Resource: ${String(item.resourceType ?? "-")} / ${String(item.resourceId ?? "-")}`,
                      `Created: ${String(item.createdAt ?? "-")}`,
                      `Details: ${String(item.detailsJson ?? "-")}`
                    ]}
                  />
                )}
              />
            }
          />
          <Route
            path="/transactions"
            element={
              <DataPage
                auth={auth}
                title="Transaction Ledger"
                subtitle="Every funds movement is recorded here."
                endpoint="/admin/transactions"
                renderItem={(item, index) => (
                  <Card
                    key={String(item.id ?? index)}
                    title={String(item.orderId ?? "Transaction")}
                    lines={[
                      `User: ${String((item.user as JsonRecord | undefined)?.phone ?? "-")}`,
                      `Type: ${String(item.type ?? "-")}`,
                      `Amount: ${String(item.amount ?? 0)}`,
                      `Balance: ${String(item.balanceBefore ?? 0)} -> ${String(item.balanceAfter ?? 0)}`
                    ]}
                  />
                )}
              />
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export function App() {
  const [auth, setAuth] = useState<AuthState | null>(() => readStoredAuth());

  useEffect(() => {
    if (!auth) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  }, [auth]);

  return (
    <Routes>
      <Route
        path="/login"
        element={auth ? <Navigate to="/" replace /> : <LoginPage onAuthenticated={(payload) => setAuth({ token: payload.accessToken, user: payload.user })} />}
      />
      <Route
        path="/register"
        element={auth ? <Navigate to="/" replace /> : <RegisterPage onAuthenticated={(payload) => setAuth({ token: payload.accessToken, user: payload.user })} />}
      />
      <Route
        path="/*"
        element={
          <ProtectedRoute auth={auth}>
            <ShellLayout auth={auth as AuthState} onLogout={() => setAuth(null)} />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
