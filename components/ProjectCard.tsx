import Image from "next/image";
import Link from "next/link";
import { Project } from "@/data/projects";

export function ProjectCard({
  project,
  variant = "wide",
}: {
  project: Project;
  variant?: "wide" | "tall" | "full";
}) {
  const variantClass =
    variant === "wide"
      ? "project-card--wide"
      : variant === "tall"
      ? "project-card--tall"
      : "";

  return (
    <Link href={`/projeler/${project.slug}`} className={`project-card ${variantClass}`}>
      <div className="project-card__frame">
        <Image
          src={project.image}
          alt={`${project.name} — ${project.location}`}
          fill
          sizes="(max-width: 900px) 100vw, 60vw"
          style={{ objectFit: "cover" }}
        />
      </div>
      <div className="project-card__meta">
        <div>
          <p className="project-card__name">{project.name}</p>
          <p className="project-card__sub">
            {project.location} — {project.systemType}
          </p>
        </div>
        <span className="project-card__arrow" aria-hidden="true">
          ↗
        </span>
      </div>
    </Link>
  );
}
