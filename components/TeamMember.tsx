import { TeamMember as TeamMemberType } from "@/data/team";

export function TeamMember({ member }: { member: TeamMemberType }) {
  return (
    <div className="team-card">
      <p className="label team-card__role">{member.role}</p>
      <p className="team-card__name">{member.name}</p>
      <a href={`mailto:${member.email}`} className="team-card__email">
        {member.email}
      </a>
    </div>
  );
}
