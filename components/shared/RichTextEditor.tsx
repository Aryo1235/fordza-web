"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  List, 
  ListOrdered, 
  Quote, 
  Undo, 
  Redo,
  Heading1,
  Heading2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string | null | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  const buttons = [
    {
      icon: <Heading1 className="w-4 h-4" />,
      onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: editor.isActive("heading", { level: 1 }),
      title: "Heading 1",
    },
    {
      icon: <Heading2 className="w-4 h-4" />,
      onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: editor.isActive("heading", { level: 2 }),
      title: "Heading 2",
    },
    {
      icon: <Bold className="w-4 h-4" />,
      onClick: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive("bold"),
      title: "Bold",
    },
    {
      icon: <Italic className="w-4 h-4" />,
      onClick: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive("italic"),
      title: "Italic",
    },
    {
      icon: <UnderlineIcon className="w-4 h-4" />,
      onClick: () => editor.chain().focus().toggleUnderline().run(),
      isActive: editor.isActive("underline"),
      title: "Underline",
    },
    {
      icon: <List className="w-4 h-4" />,
      onClick: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive("bulletList"),
      title: "Bullet List",
    },
    {
      icon: <ListOrdered className="w-4 h-4" />,
      onClick: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: editor.isActive("orderedList"),
      title: "Ordered List",
    },
    {
      icon: <Quote className="w-4 h-4" />,
      onClick: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: editor.isActive("blockquote"),
      title: "Blockquote",
    },
    {
      icon: <Undo className="w-4 h-4" />,
      onClick: () => editor.chain().focus().undo().run(),
      isActive: false,
      title: "Undo",
    },
    {
      icon: <Redo className="w-4 h-4" />,
      onClick: () => editor.chain().focus().redo().run(),
      isActive: false,
      title: "Redo",
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-stone-100 bg-stone-50/50 rounded-t-xl">
      {buttons.map((btn, i) => (
        <button
          key={i}
          type="button"
          onClick={btn.onClick}
          title={btn.title}
          className={cn(
            "p-2 rounded-lg transition-all duration-200 hover:bg-white hover:shadow-sm",
            btn.isActive ? "bg-white text-[#3C3025] shadow-sm ring-1 ring-stone-200" : "text-stone-400"
          )}
        >
          {btn.icon}
        </button>
      ))}
    </div>
  );
};

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({
        placeholder: placeholder || "Tulis deskripsi produk di sini...",
      }),
    ],
    content: value || "", // Fallback empty string if null/undefined
    immediatelyRender: false, // Fix SSR Hydration mismatch
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none min-h-[200px] p-4 focus:outline-none focus:ring-0 text-stone-600 leading-relaxed",
          className
        ),
      },
    },
  });

  return (
    <div className="w-full border border-stone-100 rounded-xl   bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} className="max-h-[300px] overflow-auto"  />
      <style jsx global>{`
        .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        .tiptap h1 { font-size: 1.5rem; font-weight: 700; margin-top: 1rem; margin-bottom: 0.5rem; color: #1c1917; }
        .tiptap h2 { font-size: 1.25rem; font-weight: 600; margin-top: 0.75rem; margin-bottom: 0.5rem; color: #292524; }
        .tiptap strong { font-weight: 700; color: #1c1917; }
        .tiptap u { text-decoration: underline; }
        .tiptap ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
        .tiptap ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 1rem; }
        .tiptap blockquote { border-left: 3px solid #e5e7eb; padding-left: 1rem; font-style: italic; margin-bottom: 1rem; }
      `}</style>
    </div>
  );
}
