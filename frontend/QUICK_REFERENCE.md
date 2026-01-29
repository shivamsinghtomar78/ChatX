# shadcn UI Quick Reference

## 🚀 Quick Start

```bash
cd frontend
npm install
npm start
```

## 📦 Component Imports

```jsx
// Buttons
import { Button } from "./components/ui/button"

// Forms
import { Input } from "./components/ui/input"
import { Textarea } from "./components/ui/textarea"

// Layout
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
import { Separator } from "./components/ui/separator"

// Overlays
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./components/ui/dialog"
import { Toast, ToastProvider } from "./components/ui/toast"

// Data Display
import { Avatar, AvatarFallback, AvatarImage } from "./components/ui/avatar"
import { Badge } from "./components/ui/badge"
import { Skeleton } from "./components/ui/skeleton"

// Navigation
import { Command, CommandInput, CommandList } from "./components/ui/command"
import { ScrollArea } from "./components/ui/scroll-area"

// Utils
import { cn } from "./lib/utils"
```

## 🎨 Common Patterns

### Button
```jsx
<Button variant="default">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>
```

### Card
```jsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content
  </CardContent>
</Card>
```

### Dialog
```jsx
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    <div>Content</div>
  </DialogContent>
</Dialog>
```

### Avatar
```jsx
<Avatar>
  <AvatarFallback>
    <User className="h-4 w-4" />
  </AvatarFallback>
</Avatar>
```

### Badge
```jsx
<Badge variant="default">New</Badge>
<Badge variant="secondary">5</Badge>
<Badge variant="destructive">Error</Badge>
```

### Input
```jsx
<Input 
  type="text" 
  placeholder="Search..." 
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

### Skeleton
```jsx
<Skeleton className="h-4 w-full" />
<Skeleton className="h-8 w-8 rounded-full" />
```

## 🎯 Styling with cn()

```jsx
import { cn } from "./lib/utils"

<Button 
  className={cn(
    "custom-class",
    isActive && "bg-primary",
    isDisabled && "opacity-50"
  )}
>
  Button
</Button>
```

## 🎨 Theme Colors

```jsx
// Background
className="bg-background text-foreground"

// Primary
className="bg-primary text-primary-foreground"

// Secondary
className="bg-secondary text-secondary-foreground"

// Muted
className="bg-muted text-muted-foreground"

// Accent
className="bg-accent text-accent-foreground"

// Destructive
className="bg-destructive text-destructive-foreground"

// Border
className="border border-border"
```

## 📐 Spacing

```jsx
// Padding
className="p-2"  // 8px
className="p-4"  // 16px
className="p-6"  // 24px

// Margin
className="m-2"  // 8px
className="m-4"  // 16px
className="m-6"  // 24px

// Gap
className="gap-2"  // 8px
className="gap-4"  // 16px
className="gap-6"  // 24px
```

## 🎭 Animations

```jsx
// Fade in
className="animate-in fade-in-0 duration-200"

// Slide in
className="animate-in slide-in-from-bottom-4 duration-300"

// Hover
className="transition-all hover:shadow-md hover:scale-[1.02]"

// Active
className="active:scale-[0.98]"
```

## ♿ Accessibility

```jsx
// Button
<Button aria-label="Delete item">
  <Trash2 className="h-4 w-4" />
</Button>

// Dialog
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent aria-describedby="description">
    <DialogTitle>Title</DialogTitle>
    <div id="description">Description</div>
  </DialogContent>
</Dialog>

// Input
<Input 
  aria-label="Search conversations"
  aria-describedby="search-help"
/>
```

## 📱 Responsive

```jsx
// Mobile first
<div className="p-4 sm:p-6 md:p-8 lg:p-10">
  Content
</div>

// Grid
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id}>{item.content}</Card>)}
</div>

// Flex
<div className="flex flex-col sm:flex-row gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

## 🔍 Common Use Cases

### Loading State
```jsx
{isLoading ? (
  <Skeleton className="h-4 w-full" />
) : (
  <div>{content}</div>
)}
```

### Empty State
```jsx
<Card className="p-6 text-center">
  <p className="text-muted-foreground">No items found</p>
</Card>
```

### Error State
```jsx
<Card className="border-destructive">
  <CardContent className="p-4">
    <p className="text-destructive">Error message</p>
  </CardContent>
</Card>
```

### Success State
```jsx
<Badge variant="default" className="bg-green-500">
  Success
</Badge>
```

## 🎯 Best Practices

1. **Always use shadcn components** instead of custom HTML
2. **Use cn()** for conditional classes
3. **Follow variant patterns** (default, secondary, outline, etc.)
4. **Add ARIA labels** for accessibility
5. **Use semantic HTML** with shadcn components
6. **Maintain consistent spacing** (gap-2, gap-4, etc.)
7. **Use theme colors** instead of custom colors
8. **Test keyboard navigation**
9. **Verify screen reader compatibility**
10. **Check responsive design**

## 📚 Documentation

- **SHADCN_INTEGRATION.md** - Full integration guide
- **VISUAL_GUIDE.md** - Component examples
- **PROFESSIONAL_ENHANCEMENTS.md** - Enhancement details
- **FINAL_SUMMARY.md** - Complete summary

## ✅ Checklist

- [ ] All buttons use Button component
- [ ] All inputs use Input/Textarea
- [ ] All cards use Card component
- [ ] All modals use Dialog
- [ ] All avatars use Avatar
- [ ] All badges use Badge
- [ ] Proper ARIA labels
- [ ] Keyboard navigation works
- [ ] Responsive on mobile
- [ ] Theme colors used

---

**Quick Tip**: Use `cn()` from `./lib/utils` to merge Tailwind classes properly!
