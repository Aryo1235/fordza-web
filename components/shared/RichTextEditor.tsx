"use client";

import { useEditor, EditorContent, Extension } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
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
  Heading2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Palette
} from "lucide-react";
import { cn } from "@/lib/utils";

// Custom LineHeight Extension
const LineHeight = Extension.create({
  name: "lineHeight",
  addOptions() {
    return {
      types: ["paragraph", "heading"],
      defaultLineHeight: "normal",
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineHeight: {
            default: this.options.defaultLineHeight,
            parseHTML: (element) => element.style.lineHeight || this.options.defaultLineHeight,
            renderHTML: (attributes) => {
              if (attributes.lineHeight === this.options.defaultLineHeight) {
                return {};
              }
              return { style: `line-height: ${attributes.lineHeight}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setLineHeight: (lineHeight: string) => ({ commands }) => {
        return this.options.types.every((type: string) => commands.updateAttributes(type, { lineHeight }));
      },
      unsetLineHeight: () => ({ commands }) => {
        return this.options.types.every((type: string) => commands.resetAttributes(type, ["lineHeight"]));
      },
    };
  },
});

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    lineHeight: {
      setLineHeight: (lineHeight: string) => ReturnType;
      unsetLineHeight: () => ReturnType;
    };
  }
}

interface RichTextEditorProps {
  value: string | null | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  const basicButtons = [
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
  ];

  const alignButtons = [
    {
      icon: <AlignLeft className="w-4 h-4" />,
      onClick: () => editor.chain().focus().setTextAlign("left").run(),
      isActive: editor.isActive({ textAlign: "left" }),
      title: "Rata Kiri",
    },
    {
      icon: <AlignCenter className="w-4 h-4" />,
      onClick: () => editor.chain().focus().setTextAlign("center").run(),
      isActive: editor.isActive({ textAlign: "center" }),
      title: "Rata Tengah",
    },
    {
      icon: <AlignRight className="w-4 h-4" />,
      onClick: () => editor.chain().focus().setTextAlign("right").run(),
      isActive: editor.isActive({ textAlign: "right" }),
      title: "Rata Kanan",
    },
    {
      icon: <AlignJustify className="w-4 h-4" />,
      onClick: () => editor.chain().focus().setTextAlign("justify").run(),
      isActive: editor.isActive({ textAlign: "justify" }),
      title: "Justify",
    },
  ];

  const historyButtons = [
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

  const colors = [
    { name: "Default", value: "" },
    { name: "Charcoal", value: "#4A3B2E" },
    { name: "Red", value: "#C14444" },
    { name: "Blue", value: "#2267A2" },
    { name: "Green", value: "#10B981" },
    { name: "Amber", value: "#D97706" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-y-2 gap-x-1 p-2 border-b border-stone-100 bg-stone-50/50 rounded-t-xl">
      {/* Basic Style Group */}
      <div className="flex items-center gap-0.5 border-r border-stone-200 pr-1.5 mr-1">
        {basicButtons.map((btn, i) => (
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

      {/* Alignment Group */}
      <div className="flex items-center gap-0.5 border-r border-stone-200 pr-1.5 mr-1">
        {alignButtons.map((btn, i) => (
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

      {/* Line Height Group */}
      <div className="flex items-center gap-1.5 border-r border-stone-200 pr-1.5 mr-1">
        <select
          title="Line Height (Jarak Baris)"
          onChange={(e) => {
            const val = e.target.value;
            if (val === "normal") {
              editor.chain().focus().unsetLineHeight().run();
            } else {
              editor.chain().focus().setLineHeight(val).run();
            }
          }}
          className="h-8 rounded-lg border border-stone-200 bg-white px-2 py-0.5 text-xs text-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-400 shadow-sm cursor-pointer"
        >
          <option value="normal">Spasi: Normal</option>
          <option value="1.2">Spasi: 1.2</option>
          <option value="1.4">Spasi: 1.4</option>
          <option value="1.5">Spasi: 1.5</option>
          <option value="1.6">Spasi: 1.6</option>
          <option value="1.8">Spasi: 1.8</option>
          <option value="2.0">Spasi: 2.0</option>
        </select>
      </div>

      {/* Color Picker Group */}
      <div className="flex items-center gap-1.5 pr-1">
        <Palette className="w-4 h-4 text-stone-400" />
        <div className="flex items-center gap-1">
          {colors.map((c) => (
            <button
              key={c.name}
              type="button"
              title={`Warna: ${c.name}`}
              onClick={() => {
                if (c.value === "") {
                  editor.chain().focus().unsetColor().run();
                } else {
                  editor.chain().focus().setColor(c.value).run();
                }
              }}
              className={cn(
                "w-4 h-4 rounded-full border border-stone-200 hover:scale-110 active:scale-95 transition-transform",
                c.value === "" ? "bg-stone-200" : "",
                editor.isActive("textStyle", { color: c.value }) ? "ring-2 ring-stone-400 ring-offset-1" : ""
              )}
              style={c.value ? { backgroundColor: c.value } : {}}
            />
          ))}
          <input
            type="color"
            title="Warna Kustom"
            value={editor.getAttributes("textStyle").color || "#000000"}
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            className="w-5 h-5 cursor-pointer rounded border border-stone-200 p-0 bg-transparent shrink-0"
          />
        </div>
      </div>

      {/* History Group */}
      <div className="flex items-center gap-0.5 ml-auto">
        {historyButtons.map((btn, i) => (
          <button
            key={i}
            type="button"
            onClick={btn.onClick}
            title={btn.title}
            className="p-2 rounded-lg transition-all duration-200 hover:bg-white hover:shadow-sm text-stone-400"
          >
            {btn.icon}
          </button>
        ))}
      </div>
    </div>
  );
};

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      LineHeight,
      Placeholder.configure({
        placeholder: placeholder || "Tulis deskripsi produk di sini...",
      }),
    ],
    content: value || "",
    immediatelyRender: false,
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
    <div className="w-full border border-stone-100 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} className="max-h-[300px] overflow-auto" />
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
