import { type Section } from "@/lib/sectionQueries";

interface CustomHTMLSectionProps {
  section: Section;
}

export const CustomHTMLSection = ({ section }: CustomHTMLSectionProps) => {
  if (!section.html_content) return null;

  return (
    <div className="mb-6 w-full">
      <div
        className="custom-html-section"
        dangerouslySetInnerHTML={{ __html: section.html_content }}
      />
    </div>
  );
};
