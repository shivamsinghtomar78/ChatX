# ChatX Visual Component Guide

## 🎨 Component Showcase

### Button Component
```jsx
import { Button } from './components/ui/button';

// Variants
<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Sizes
<Button size="default">Default</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>
```

### Card Component
```jsx
import { Card, CardHeader, CardTitle, CardContent } from './components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
  </CardHeader>
  <CardContent>
    Card content goes here
  </CardContent>
</Card>
```

### Dialog Component
```jsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './components/ui/dialog';

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
    </DialogHeader>
    <div>Dialog content</div>
  </DialogContent>
</Dialog>
```

### Badge Component
```jsx
import { Badge } from './components/ui/badge';

<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="outline">Outline</Badge>
```

### Skeleton Component
```jsx
import { Skeleton } from './components/ui/skeleton';

<Skeleton className="h-4 w-full" />
<Skeleton className="h-8 w-8 rounded-full" />
```

## 🎯 Usage Examples

### Example 1: Message Card
```jsx
<Card className="mb-4">
  <CardContent className="p-4">
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
        👤
      </div>
      <div className="flex-1">
        <p>Message content here</p>
        <div className="flex gap-2 mt-2">
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Copy className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <Pin className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  </CardContent>
</Card>
```

### Example 2: Conversation List Item
```jsx
<Card className="cursor-pointer hover:shadow-md transition-all mb-2">
  <div className="flex items-center justify-between p-3">
    <div className="flex-1 min-w-0">
      <h3 className="font-medium truncate">Conversation Title</h3>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-xs text-muted-foreground">Oct 25</span>
        <Badge variant="secondary" className="text-xs">
          <MessageSquare className="w-3 h-3 mr-1" />
          5
        </Badge>
      </div>
    </div>
    <Button variant="ghost" size="icon">
      <Trash2 className="h-4 w-4" />
    </Button>
  </div>
</Card>
```

### Example 3: Loading State
```jsx
// Message skeleton
<div className="flex gap-3 mb-6">
  <Skeleton className="w-8 h-8 rounded-full" />
  <div className="flex-1 space-y-2">
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
  </div>
</div>

// Typing indicator
<Card className="inline-block">
  <div className="p-3 flex gap-1">
    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
    <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
  </div>
</Card>
```

### Example 4: Action Modal
```jsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>Chat Actions</DialogTitle>
    </DialogHeader>
    <div className="grid gap-2 py-4">
      <Button variant="outline" className="justify-start h-auto py-3">
        <Download className="mr-3 h-4 w-4" />
        <div className="text-left">
          <div className="font-medium">Export Chat</div>
          <div className="text-xs text-muted-foreground">Download as text file</div>
        </div>
      </Button>
      <Button variant="destructive" className="justify-start h-auto py-3">
        <Trash2 className="mr-3 h-4 w-4" />
        <div className="text-left">
          <div className="font-medium">Clear Chat</div>
          <div className="text-xs text-muted-foreground">Remove all messages</div>
        </div>
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

## 🎨 Color System

### Theme Colors
```css
/* Light Mode */
--background: 0 0% 100%;
--foreground: 222.2 47.4% 11.2%;
--primary: 221.2 83.2% 53.3%;
--secondary: 210 40% 96.1%;
--muted: 210 40% 96.1%;
--accent: 210 40% 96.1%;
--destructive: 0 100% 50%;

/* Dark Mode */
--background: 224 71% 4%;
--foreground: 213 31% 91%;
--primary: 210 40% 98%;
--secondary: 222.2 47.4% 11.2%;
--muted: 223 47% 11%;
--accent: 216 34% 17%;
--destructive: 0 63% 31%;
```

### Usage
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
```

## 📐 Spacing System

```jsx
// Padding
className="p-2"   // 8px
className="p-3"   // 12px
className="p-4"   // 16px
className="p-6"   // 24px

// Margin
className="m-2"   // 8px
className="m-3"   // 12px
className="m-4"   // 16px
className="m-6"   // 24px

// Gap
className="gap-2" // 8px
className="gap-3" // 12px
className="gap-4" // 16px
```

## 🔤 Typography

```jsx
// Headings
<h1 className="text-4xl font-bold">Heading 1</h1>
<h2 className="text-3xl font-semibold">Heading 2</h2>
<h3 className="text-2xl font-semibold">Heading 3</h3>
<h4 className="text-xl font-medium">Heading 4</h4>

// Body text
<p className="text-base">Normal text</p>
<p className="text-sm">Small text</p>
<p className="text-xs">Extra small text</p>

// Muted text
<p className="text-muted-foreground">Muted text</p>
```

## 🎭 Animations

```jsx
// Hover effects
className="hover:shadow-md hover:scale-[1.02] transition-all"

// Focus effects
className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"

// Active effects
className="active:scale-[0.98]"

// Fade in
className="animate-in fade-in-0 duration-200"

// Slide in
className="animate-in slide-in-from-bottom-4 duration-300"
```

## 📱 Responsive Design

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

## ♿ Accessibility Patterns

```jsx
// Button with icon
<Button aria-label="Delete conversation">
  <Trash2 className="h-4 w-4" />
</Button>

// Interactive card
<Card
  role="button"
  tabIndex={0}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
  aria-label="Conversation: Title"
>
  Content
</Card>

// Dialog
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent aria-describedby="dialog-description">
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    <div id="dialog-description">Description</div>
  </DialogContent>
</Dialog>
```

## 🎯 Best Practices

### 1. Always use semantic HTML
```jsx
// ✅ Good
<button onClick={handleClick}>Click me</button>

// ❌ Bad
<div onClick={handleClick}>Click me</div>
```

### 2. Provide ARIA labels
```jsx
// ✅ Good
<Button aria-label="Close dialog">
  <X className="h-4 w-4" />
</Button>

// ❌ Bad
<Button>
  <X className="h-4 w-4" />
</Button>
```

### 3. Use proper focus management
```jsx
// ✅ Good
<Button className="focus-visible:ring-2 focus-visible:ring-ring">
  Click me
</Button>

// ❌ Bad
<Button className="focus:outline-none">
  Click me
</Button>
```

### 4. Ensure minimum touch targets
```jsx
// ✅ Good
<Button size="icon" className="h-10 w-10">
  <Icon />
</Button>

// ❌ Bad
<button className="h-4 w-4">
  <Icon />
</button>
```

## 📊 Component Checklist

When creating a new component:
- [ ] Uses shadcn UI components
- [ ] Has proper ARIA labels
- [ ] Supports keyboard navigation
- [ ] Has focus indicators
- [ ] Is responsive (mobile-first)
- [ ] Has loading states
- [ ] Has error states
- [ ] Is memoized (if needed)
- [ ] Has proper TypeScript types
- [ ] Is documented

---

**Remember**: Consistency is key! Always use the established patterns and components.
