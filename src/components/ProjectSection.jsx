import { ExternalLink, FolderGit2, ArrowRight } from "lucide-react";
const projects = [
  {
    id: 1,
    title: "医疗管理面板",
    desc: "覆盖「医生排班 -> 患者实名挂号 -> 扫码支付 -> 医生接诊写病历」全链路的医疗预约挂号平台",
    image: "/projects/project1.png",
    tags: ["Golang", "PGSQL", "Redis", "RocketMQ", "TypeScript", "React", "Tailwind CSS"],
    demoUrl: "https://medical.jxutcm.top",
    githubUrl: "https://github.com/Anyeling0620/Medical-Backend",
  },
  {
    id: 4,
    title: "仿联想商城全栈项目",
    desc: "使用 React 19、TypeScript 和 Tailwind CSS 构建的联想商城电商前台，覆盖商品浏览、秒杀、搜索、购物车、下单支付到售后的完整链路。",
    image: "/projects/project4.png",
    tags: ["React", "TypeScript", "Vite", "Tailwindcss", "Zustand", "Ant Design", "React Router"],
    demoUrl: "https://shop.lenovo.jxutcm.top",
    githubUrl: "https://github.com/Anyeling0620/Lenovo-Shop",
  },
  {
    id: 2,
    title: "响应式仪表盘",
    desc: "使用 React、Tailwind CSS、Recharts 和 Lucide 构建的精致仪表盘。",
    image: "/projects/project3.png",
    tags: ["React", "Tailwindcss", "Rechart"],
    demoUrl: "https://pannel.jxutcm.top",
    githubUrl: "https://github.com/Anyeling0620/DashboardFrontend",
  },
  {
    id: 3,
    title: "软件服务落地页",
    desc: "使用 React 和 Tailwind CSS 构建的产品落地页应用。",
    image: "/projects/project2.png",
    tags: ["React", "Tailwindcss", "Zustand"],
    demoUrl: "https://home.jxutcm.top",
    githubUrl: "https://github.com/Anyeling0620/SaaSLanding",
  },
];
export default function ProjectSection() {
  return (
    <section id="project" className="py-24 px-4 relative">
      <div className="container mx-auto max-w-5xl">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-center">
          精选<span className="text-primary">项目</span>
        </h2>
        <p className="text-center text-foreground mb-12 max-w-2xl mx-auto">
          这里展示了一些我近期完成的项目。
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {projects.map((project, key) => (
            <div
              className="group bg-card rounded-lg overflow-hidden shadow-xs card-hover gradient-border"
              key={key}
            >
              <div className="h-48 overflow-hidden">
                <img
                  src={project.image}
                  alt={`project${project.id}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>

              <div className="p-6">
                <div className="flex flex-wrap justify-around gap-2 mb-4">
                  {project.tags.map((tag) => (
                    <span className="px-2 py-1 border text-sm font-medium rounded-full bg-primary/80 text-foreground">
                      {tag}
                    </span>
                  ))}
                </div>

                <h3 className="text-xl font-semibold mb-1"> {project.title}</h3>
                <p className="text-foreground text-sm mb-4"> {project.desc}</p>
                <div className="flex justify-between items-center">
                  <div className="flex space-x-3">
                    <a
                      href={project.demoUrl}
                      target="_blank"
                      className="text-foreground/80 hover:text-primary transition-colors duration-300"
                    >
                      <ExternalLink size={20}></ExternalLink>
                    </a>
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      className="text-foreground/80 hover:text-primary transition-colors duration-300"
                    >
                      <FolderGit2 size={20} />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <a
            href="https://github.com/Anyeling0620"
            target="_blank"
            className="cosmic-button w-fit flex mx-auto gap-2 items-center"
          >
            查看我的代码主页 <ArrowRight size={16}></ArrowRight>
          </a>
        </div>
      </div>
    </section>
  );
}
