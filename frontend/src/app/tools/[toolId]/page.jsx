import { notFound } from "next/navigation";
import { getTool, tools } from "@/config/tools";
import SiteNav from "@/components/SiteNav";
import ToolPageBody from "@/components/ToolPageBody";
import ToolSidebar from "@/components/ToolSidebar";

export function generateStaticParams() {
  return tools.map((tool) => ({ toolId: tool.id }));
}

export function generateMetadata({ params }) {
  const tool = getTool(params.toolId);
  return tool
    ? { title: `${tool.title} - AnyKit`, description: tool.description }
    : { title: "AnyKit" };
}

export default function ToolPage({ params }) {
  const tool = getTool(params.toolId);
  if (!tool) notFound();
  return (
    <div className="studio-page">
      <SiteNav studio />
      <div className="studio-shell">
        <ToolSidebar activeId={tool.id} />
        <ToolPageBody tool={tool} />
      </div>
    </div>
  );
}
