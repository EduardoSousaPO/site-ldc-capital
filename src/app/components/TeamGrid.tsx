"use client";

import Image from "next/image";
import { Instagram, Linkedin } from "lucide-react";
import { TeamMember, getTeamMembers } from "../lib/team";

/**
 * Props do componente TeamMemberCard
 */
interface TeamMemberCardProps {
  member: TeamMember;
  index: number;
}

/**
 * Card individual de um membro da equipe
 */
function TeamMemberCard({ member, index }: TeamMemberCardProps) {
  return (
    <div
      className="text-center group animate-fade-in w-full max-w-[280px]"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Foto - Aspect ratio 3:4 para fotos verticais com efeitos premium */}
      <div className="relative w-full aspect-[3/4] mx-auto mb-5 overflow-hidden rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-white/10 group-hover:shadow-[0_12px_40px_rgb(0,0,0,0.5)] transition-all duration-500">
        {/* Imagem com filtros de aprimoramento */}
        <Image
          src={member.photo}
          alt={`Foto de ${member.name}`}
          fill
          className="object-cover object-top transition-all duration-500 group-hover:scale-105 contrast-[1.05] brightness-[1.02] saturate-[1.1]"
          sizes="280px"
          quality={85}
          loading="eager"
        />
        {/* Overlay gradiente sutil para uniformizar tons */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#262d3d]/40 via-transparent to-transparent opacity-60"></div>
        {/* Borda interna sutil */}
        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10"></div>
      </div>

      {/* Nome e Certificações */}
      <h3 className="font-serif text-lg lg:text-xl font-bold text-white">
        {member.name}
        {member.certifications && member.certifications.length > 0 && (
          <span className="text-[#98ab44]">
            , {member.certifications.join(", ")}
          </span>
        )}
      </h3>

      {/* Cargo */}
      <p className="text-sm text-white/80 mt-1 mb-3">{member.role}</p>

      {/* Linha divisória decorativa */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <div className="w-8 h-px bg-white/20"></div>
        <div className="w-2 h-2 rounded-full bg-[#98ab44]/50"></div>
        <div className="w-8 h-px bg-white/20"></div>
      </div>

      {/* Descrição */}
      {member.description && (
        <p className="text-xs text-white/60 max-w-xs mx-auto leading-relaxed mb-4">
          {member.description}
        </p>
      )}

      {/* Redes Sociais - ao final */}
      {member.social && (
        <div className="flex justify-center gap-2 mt-2">
          {member.social.instagram && (
            <a
              href={member.social.instagram !== "#" ? member.social.instagram : undefined}
              target={member.social.instagram !== "#" ? "_blank" : undefined}
              rel={member.social.instagram !== "#" ? "noopener noreferrer" : undefined}
              aria-label={`Instagram de ${member.name}`}
              className={`w-8 h-8 rounded-md bg-[#1a1f2e] border border-white/30 flex items-center justify-center transition-colors ${
                member.social.instagram !== "#" ? "hover:bg-[#98ab44] hover:border-[#98ab44] cursor-pointer" : "cursor-default"
              }`}
            >
              <Instagram className="w-4 h-4 text-white" />
            </a>
          )}
          {member.social.linkedin && (
            <a
              href={member.social.linkedin !== "#" ? member.social.linkedin : undefined}
              target={member.social.linkedin !== "#" ? "_blank" : undefined}
              rel={member.social.linkedin !== "#" ? "noopener noreferrer" : undefined}
              aria-label={`LinkedIn de ${member.name}`}
              className={`w-8 h-8 rounded-md bg-[#1a1f2e] border border-white/30 flex items-center justify-center transition-colors ${
                member.social.linkedin !== "#" ? "hover:bg-[#98ab44] hover:border-[#98ab44] cursor-pointer" : "cursor-default"
              }`}
            >
              <Linkedin className="w-4 h-4 text-white" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Props do componente TeamGrid
 */
interface TeamGridProps {
  /** Se deve mostrar descrições dos membros */
  showDescriptions?: boolean;
}

/**
 * Grid de membros da equipe LDC Capital
 */
export default function TeamGrid({ showDescriptions = true }: TeamGridProps) {
  const members = getTeamMembers();

  return (
    <section className="py-16 lg:py-24 bg-[#262d3d]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-14 justify-items-center">
          {members.map((member, index) => (
            <TeamMemberCard
              key={member.id}
              member={
                showDescriptions
                  ? member
                  : { ...member, description: undefined }
              }
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
