"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqItems } from "@/app/lib/faq";

export default function FAQ() {
  return (
    <section className="py-16 lg:py-24 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl lg:text-4xl font-bold text-[#262d3d] mb-4">
            Dúvidas Frequentes
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Respondemos as principais questões sobre nossa consultoria e modelo de atuação
          </p>
        </div>

        <Accordion type="multiple" className="space-y-4">
          {faqItems.map((item) => (
            <AccordionItem
              key={item.id}
              value={item.id}
              className="bg-white rounded-lg border border-gray-200 px-6 shadow-sm"
            >
              <AccordionTrigger className="text-left font-semibold text-[#262d3d] hover:text-[#98ab44] transition-colors py-6 text-base">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 leading-relaxed pb-6 text-base">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-6">
            Ainda tem dúvidas? Fale diretamente conosco.
          </p>
          <button
            onClick={() => {
              const contactForm = document.getElementById("contact-form");
              if (contactForm) {
                contactForm.scrollIntoView({ behavior: "smooth" });
              }
            }}
            className="bg-[#98ab44] hover:bg-[#98ab44]/90 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Entre em contato
          </button>
        </div>
      </div>
    </section>
  );
}
