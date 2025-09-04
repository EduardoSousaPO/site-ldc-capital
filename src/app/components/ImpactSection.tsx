export default function ImpactSection() {
  return (
    <section className="relative py-24 lg:py-32 bg-fixed bg-center bg-cover bg-[url('/images/horizon-bg.jpg')] bg-gray-800">
      {/* Overlay */}
      <div className="absolute inset-0 bg-[#262d3d]/80"></div>
      
      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-6">
          <span className="inline-block px-4 py-2 bg-[#98ab44]/20 text-[#98ab44] text-sm font-medium rounded-full border border-[#98ab44]/30">
            Nossa Filosofia
          </span>
        </div>
        
        <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
          Mais do que finanças,{" "}
          <span className="text-[#98ab44]">direção</span>
        </h2>
        
        <p className="mt-6 text-xl md:text-2xl text-gray-200 max-w-2xl mx-auto leading-relaxed">
          Não prometemos atalhos, oferecemos estrutura. Direção clara, segura e experiente para grandes patrimônios.
        </p>
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#98ab44]/50 to-transparent"></div>
    </section>
  );
}
