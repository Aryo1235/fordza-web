# UI System Documentation - Fordza-Web

## 📋 Overview

Fordza-Web menggunakan design system modern dengan Tailwind CSS 4, Shadcn/UI, dan Framer Motion untuk animasi.

---

## 🎨 Design Tokens

### **Color Palette**

**Primary Colors:**
- `primary`: Brand color (blue)
- `primary-foreground`: Text on primary

**Neutral Colors:**
- `background`: Page background
- `foreground`: Main text color
- `card`: Card background
- `muted`: Muted background
- `border`: Border color

**Semantic Colors:**
- `destructive`: Error/delete actions (red)
- `success`: Success states (green)
- `warning`: Warning states (yellow)
- `info`: Info states (blue)

### **Typography**

**Font Families:**
- `font-sans`: System font stack (default)
- `font-mono`: Monospace for code

**Font Sizes:**
```css
text-xs: 0.75rem (12px)
text-sm: 0.875rem (14px)
text-base: 1rem (16px)
text-lg: 1.125rem (18px)
text-xl: 1.25rem (20px)
text-2xl: 1.5rem (24px)
text-3xl: 1.875rem (30px)
text-4xl: 2.25rem (36px)
```

**Font Weights:**
- `font-light`: 300
- `font-normal`: 400
- `font-medium`: 500
- `font-semibold`: 600
- `font-bold`: 700

### **Spacing**

Tailwind spacing scale (4px base):
```
0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 56, 64
```

### **Border Radius**
```
rounded-none: 0
rounded-sm: 0.125rem (2px)
rounded: 0.25rem (4px)
rounded-md: 0.375rem (6px)
rounded-lg: 0.5rem (8px)
rounded-xl: 0.75rem (12px)
rounded-2xl: 1rem (16px)
rounded-full: 9999px
```

### **Shadows**
```
shadow-sm: Small shadow
shadow: Default shadow
shadow-md: Medium shadow
shadow-lg: Large shadow
shadow-xl: Extra large shadow
```

---

## 🧩 Shadcn/UI Components

### **Button**

**Variants:**
- `default`: Primary button
- `destructive`: Delete/danger button
- `outline`: Outlined button
- `secondary`: Secondary button
- `ghost`: Transparent button
- `link`: Link-styled button

**Sizes:**
- `default`: Standard size
- `sm`: Small
- `lg`: Large
- `icon`: Icon-only (square)

**Usage:**
```tsx
import { Button } from "@/components/ui/button"

<Button variant="default" size="lg">
  Click Me
</Button>
```

---

### **Input**

Text input dengan styling konsisten.

**Usage:**
```tsx
import { Input } from "@/components/ui/input"

<Input 
  type="text" 
  placeholder="Enter name" 
/>
```

---

### **Select**

Dropdown select dengan Radix UI.

**Usage:**
```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="1">Option 1</SelectItem>
    <SelectItem value="2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

---

### **Dialog**

Modal dialog.

**Usage:**
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
    </DialogHeader>
    <p>Dialog content here</p>
  </DialogContent>
</Dialog>
```

---

### **Sheet**

Slide-out panel (drawer).

**Usage:**
```tsx
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

<Sheet>
  <SheetTrigger asChild>
    <Button>Open Sheet</Button>
  </SheetTrigger>
  <SheetContent side="right">
    <p>Sheet content</p>
  </SheetContent>
</Sheet>
```

---

### **Card**

Container dengan shadow & border.

**Usage:**
```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Card content</p>
  </CardContent>
</Card>
```

---

### **Table**

Data table dengan styling.

**Usage:**
```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Price</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Product 1</TableCell>
      <TableCell>Rp 100.000</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

---

### **Badge**

Status badge.

**Variants:**
- `default`: Default badge
- `secondary`: Secondary badge
- `destructive`: Error badge
- `outline`: Outlined badge

**Usage:**
```tsx
import { Badge } from "@/components/ui/badge"

<Badge variant="default">New</Badge>
```

---

## 🎯 Custom Components

### **ImageUpload**

Upload gambar dengan preview & drag-drop.

**Location:** `components/shared/ImageUpload.tsx`

**Features:**
- Drag & drop
- Multiple files
- Preview thumbnails
- Client-side compression
- S3 upload

**Usage:**
```tsx
import { ImageUpload } from "@/components/shared/ImageUpload"

<ImageUpload
  value={images}
  onChange={setImages}
  maxFiles={10}
/>
```

---

### **RichTextEditor**

WYSIWYG editor dengan Tiptap.

**Location:** `components/shared/RichTextEditor.tsx`

**Features:**
- Bold, italic, underline
- Headings
- Lists (bullet, numbered)
- Links
- Placeholder

**Usage:**
```tsx
import { RichTextEditor } from "@/components/shared/RichTextEditor"

<RichTextEditor
  value={content}
  onChange={setContent}
  placeholder="Enter description..."
/>
```

---

### **DataTable**

Table dengan sorting & pagination.

**Location:** `components/shared/DataTable.tsx`

**Features:**
- Column sorting
- Pagination
- Row selection
- Custom cell rendering

**Usage:**
```tsx
import { DataTable } from "@/components/shared/DataTable"

<DataTable
  columns={columns}
  data={data}
  pageSize={10}
/>
```

---

### **Pagination**

Pagination controls.

**Location:** `components/shared/Pagination.tsx`

**Usage:**
```tsx
import { Pagination } from "@/components/shared/Pagination"

<Pagination
  currentPage={page}
  totalPages={totalPages}
  onPageChange={setPage}
/>
```

---

### **ConfirmDialog**

Confirmation dialog.

**Location:** `components/shared/ConfirmDialog.tsx`

**Usage:**
```tsx
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"

<ConfirmDialog
  open={open}
  onOpenChange={setOpen}
  onConfirm={handleDelete}
  title="Delete Product?"
  description="This action cannot be undone."
/>
```

---

### **StatusBadge**

Badge untuk status produk.

**Location:** `components/shared/StatusBadge.tsx`

**Usage:**
```tsx
import { StatusBadge } from "@/components/shared/StatusBadge"

<StatusBadge status="active" />
```

---

## 🎬 Animation System

### **Framer Motion**

Library untuk animasi.

**Basic Animation:**
```tsx
import { motion } from "framer-motion"

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>
```

---

### **FadeUpSection**

Fade up on scroll.

**Location:** `components/shared/animations.tsx`

**Usage:**
```tsx
import { FadeUpSection } from "@/components/shared/animations"

<FadeUpSection>
  <h1>Title</h1>
</FadeUpSection>
```

---

### **StaggerList**

Stagger animation untuk list items.

**Location:** `components/shared/animations.tsx`

**Usage:**
```tsx
import { StaggerList, StaggerItem } from "@/components/shared/animations"

<StaggerList>
  {items.map(item => (
    <StaggerItem key={item.id}>
      <Card>{item.name}</Card>
    </StaggerItem>
  ))}
</StaggerList>
```

---

## 📱 Responsive Design

### **Breakpoints**

```
sm: 640px   (Mobile landscape)
md: 768px   (Tablet)
lg: 1024px  (Desktop)
xl: 1280px  (Large desktop)
2xl: 1536px (Extra large)
```

### **Usage**

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* 1 col mobile, 2 col tablet, 3 col desktop */}
</div>
```

---

## 🎨 Layout Components

### **AdminSidebar**

Sidebar navigasi admin.

**Location:** `components/layout/admin/Sidebar.tsx`

**Features:**
- Collapsible
- Active link highlight
- Icon + text

---

### **PublicNavbar**

Navbar untuk halaman publik.

**Location:** `components/layout/public/PublicNavbar.tsx`

**Features:**
- Sticky on scroll
- Mobile menu
- Search bar
- Cart icon

---

## 🔤 Icon System

### **Lucide React**

Icon library yang digunakan.

**Usage:**
```tsx
import { ShoppingCart, User, Settings } from "lucide-react"

<ShoppingCart className="w-5 h-5" />
```

**Common Icons:**
- `ShoppingCart`: Cart
- `User`: User profile
- `Settings`: Settings
- `Search`: Search
- `Menu`: Hamburger menu
- `X`: Close
- `ChevronDown`: Dropdown arrow
- `Plus`: Add
- `Trash`: Delete
- `Edit`: Edit

---

## 📝 Form Patterns

### **React Hook Form + Zod**

**Example:**
```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const schema = z.object({
  name: z.string().min(1, "Name required"),
  price: z.number().min(0, "Price must be positive"),
})

type FormData = z.infer<typeof schema>

function MyForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema)
  })

  const onSubmit = (data: FormData) => {
    console.log(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input {...register("name")} />
      {errors.name && <p className="text-red-500">{errors.name.message}</p>}
      
      <Button type="submit">Submit</Button>
    </form>
  )
}
```

---

## 🎯 Best Practices

### **1. Component Structure**

```tsx
// ✅ Good
function ProductCard({ product }: { product: Product }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{product.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{formatRupiah(product.price)}</p>
      </CardContent>
    </Card>
  )
}
```

### **2. Styling**

```tsx
// ✅ Good - Use Tailwind utilities
<div className="flex items-center gap-4 p-4 rounded-lg bg-white shadow">

// ❌ Avoid - Inline styles
<div style={{ display: 'flex', padding: '16px' }}>
```

### **3. Responsive**

```tsx
// ✅ Good - Mobile-first
<div className="text-sm md:text-base lg:text-lg">

// ❌ Avoid - Desktop-first
<div className="text-lg md:text-base sm:text-sm">
```

### **4. Accessibility**

```tsx
// ✅ Good
<button aria-label="Close dialog">
  <X className="w-4 h-4" />
</button>

// ❌ Avoid
<div onClick={handleClick}>
  <X />
</div>
```

---

## 📚 Related Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture
- **[FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md)** - Folder structure
- **[FEATURES.md](./FEATURES.md)** - Feature overview

---

**Last Updated:** 2026-05-14  
**Version:** 1.0.0
