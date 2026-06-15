import { Link, Route, Routes } from "react-router-dom";

const cards = [
  { label: "实名认证审核", value: "12", tone: "amber" },
  { label: "待处理投诉", value: "4", tone: "red" },
  { label: "今日订单", value: "86", tone: "blue" },
  { label: "平台抽佣", value: "¥8,420", tone: "green" }
];

function Dashboard() {
  return (
    <div className="page">
      <h1>运营总览</h1>
      <div className="grid">
        {cards.map((card) => (
          <section className={`card ${card.tone}`} key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </section>
        ))}
      </div>
      <section className="panel">
        <h2>MVP 管理模块</h2>
        <p>用户、整理师、订单、审核、维权、财务统计已预留页面结构。</p>
      </section>
    </div>
  );
}

function Placeholder({ title }: { title: string }) {
  return (
    <div className="page">
      <h1>{title}</h1>
      <section className="panel">
        <p>{title}模块骨架已就绪，可继续接接口与表格组件。</p>
      </section>
    </div>
  );
}

export function App() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <strong>收纳帮</strong>
          <span>Admin Console</span>
        </div>
        <nav>
          <Link to="/">总览</Link>
          <Link to="/users">用户管理</Link>
          <Link to="/organizers">整理师管理</Link>
          <Link to="/orders">订单管理</Link>
          <Link to="/verifications">实名认证</Link>
          <Link to="/disputes">投诉维权</Link>
          <Link to="/finance">财务统计</Link>
        </nav>
      </aside>
      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<Placeholder title="用户管理" />} />
          <Route path="/organizers" element={<Placeholder title="整理师管理" />} />
          <Route path="/orders" element={<Placeholder title="订单管理" />} />
          <Route path="/verifications" element={<Placeholder title="实名认证审核" />} />
          <Route path="/disputes" element={<Placeholder title="投诉与维权" />} />
          <Route path="/finance" element={<Placeholder title="财务统计" />} />
        </Routes>
      </main>
    </div>
  );
}
