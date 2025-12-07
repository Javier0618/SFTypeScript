import { useEffect, useRef } from "react";
import { type Section } from "@/lib/sectionQueries";

interface CustomHTMLSectionProps {
  section: Section;
}

export const CustomHTMLSection = ({ section }: CustomHTMLSectionProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !section.html_content) return;

    containerRef.current.innerHTML = section.html_content;

    const scripts = containerRef.current.querySelectorAll("script");
    scripts.forEach((oldScript) => {
      const newScript = document.createElement("script");
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.textContent = oldScript.textContent;
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [section.html_content]);

  if (!section.html_content) return null;

  return (
    <div className="mb-6 w-full">
      <div ref={containerRef} className="custom-html-section" />
    </div>
  );
};
