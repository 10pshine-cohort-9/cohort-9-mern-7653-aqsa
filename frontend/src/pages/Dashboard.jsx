import Sidebar from "../components/Dashboard/Sidebar";
import Header from "../components/Dashboard/Header";
import Stats from "../components/Dashboard/Stats";
import ContinueWriting from "../components/Dashboard/ContinueWriting";
import TasksCard from "../components/Dashboard/TasksCard";
export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#fdf9f1] text-[#1c1c17] font-sans antialiased overflow-x-hidden">
      <Sidebar />
    <main className="min-h-screen md:ml-[280px] pt-20 md:pt-16 px-4 md:px-10 pb-16">
        <Header />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-w-0">
          <Stats />
          <ContinueWriting />
          <TasksCard />
        </div>
      </main>
    </div>
  );
}
