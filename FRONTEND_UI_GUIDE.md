# Frontend UI/UX Improvement Guide

## Overview

This guide covers all new UI/UX improvements created for Rentally frontend. You now have a complete, production-ready component system with 6 major additions:

1. **Theme System** (`theme/index.ts`) - Centralized design tokens
2. **Layout Components** (`components/Layout.tsx`) - Spacing and structure
3. **UI Components** (`components/UI.tsx`) - Buttons, Cards, Badges, Avatars
4. **Form Components** (`components/Form.tsx`) - Inputs, Selects, Checkboxes, Radios
5. **Feedback Components** (`components/Feedback.tsx`) - Toasts, Alerts, Modals
6. **Responsive Utilities** (`hooks/useResponsive.ts`) - Mobile-first responsiveness

---

## Quick Start

### 1. Import and Use Theme

```typescript
import { Colors, Typography, Spacing, Shadows } from '../theme';
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    backgroundColor: Colors.background.primary,
    ...Shadows.md,
  },
  title: {
    fontSize: Typography.sizes.lg,
    fontWeight: '700',
    color: Colors.text.primary,
  },
});
```

### 2. Use Layout Components

```typescript
import { Stack, Row, Column, Center, Container, Spacer } from '../components/Layout';

export default function MyScreen() {
  return (
    <Container size="md">
      <Stack gap="lg" p="md">
        <Text>Title</Text>
        <Spacer size="md" />
        <Row align="center" justify="space-between">
          <Text>Left</Text>
          <Text>Right</Text>
        </Row>
      </Stack>
    </Container>
  );
}
```

### 3. Use UI Components

```typescript
import { Button, Card, Badge, Avatar } from '../components/UI';

export default function Home() {
  return (
    <Card>
      <Row gap="md" p="md">
        <Avatar size="md" initials="JD" />
        <Column flex={1}>
          <Text>John Doe</Text>
          <Badge variant="success">Active</Badge>
        </Column>
      </Row>
      <Button onPress={() => console.log('tapped')}>
        View Profile
      </Button>
    </Card>
  );
}
```

### 4. Use Form Components

```typescript
import { FormInput, FormSelect, Checkbox, RadioGroup } from '../components/Form';
import { useState } from 'react';

export default function MyForm() {
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);

  return (
    <>
      <FormInput
        label="Email"
        placeholder="your@email.com"
        value={email}
        onChangeText={setEmail}
        icon="mail-outline"
        required
      />

      <FormSelect
        label="Category"
        options={[
          { label: 'Apartment', value: 'apartment' },
          { label: 'House', value: 'house' },
        ]}
        value={category}
        onSelect={setCategory}
      />

      <Checkbox
        label="I agree to terms"
        checked={agreed}
        onCheck={setAgreed}
      />
    </>
  );
}
```

### 5. Use Feedback Components

```typescript
import { useToast, AlertDialog, BottomSheet } from '../components/Feedback';
import { useState } from 'react';

export default function MyScreen() {
  const { toast, showToast } = useToast();
  const [showAlert, setShowAlert] = useState(false);
  const [showSheet, setShowSheet] = useState(false);

  const handleSuccess = () => {
    showToast({
      message: 'Success!',
      type: 'success',
      duration: 3000,
    });
  };

  return (
    <>
      {/* Toast renders globally */}
      {toast && <Toast {...toast} />}

      <Button onPress={handleSuccess}>
        Show Toast
      </Button>

      <AlertDialog
        visible={showAlert}
        title="Confirm"
        message="Are you sure?"
        buttons={[
          { label: 'No', onPress: () => setShowAlert(false), variant: 'secondary' },
          { label: 'Yes', onPress: () => setShowAlert(false), variant: 'primary' },
        ]}
      />

      <BottomSheet visible={showSheet} onClose={() => setShowSheet(false)} title="Options">
        <Text>Sheet content here</Text>
      </BottomSheet>
    </>
  );
}
```

### 6. Use Responsive Utilities

```typescript
import { useResponsive, useResponsiveValue } from '../hooks/useResponsive';

export default function MyScreen() {
  const { width, isPhone, isTablet } = useResponsive();

  const columnCount = useResponsiveValue({
    small: 1,
    medium: 2,
    large: 3,
    default: 2,
  });

  return (
    <View style={{ flex: 1, paddingHorizontal: isPhone ? 12 : 24 }}>
      <Text>Width: {width}</Text>
      <Text>Is Tablet: {isTablet}</Text>
      <Text>Columns: {columnCount}</Text>
    </View>
  );
}
```

---

## Component Reference

### Theme System (theme/index.ts)

**Colors**
```typescript
Colors.primary          // #2e55fa
Colors.success          // #10b981
Colors.danger           // #ef4444
Colors.gray[50-900]     // Full spectrum
Colors.text.primary     // #111111
Colors.text.secondary   // #666666
Colors.background.primary // #ffffff
```

**Typography**
```typescript
Typography.sizes.xs   // 11
Typography.sizes.base // 14
Typography.sizes.lg   // 16
Typography.sizes.2xl  // 20
Typography.sizes.5xl  // 32

Typography.styles.h1  // Large heading
Typography.styles.h4  // Medium heading
Typography.styles.body // Regular text
Typography.styles.label // Small label
```

**Spacing**
```typescript
Spacing.xs  // 4
Spacing.sm  // 8
Spacing.md  // 12
Spacing.lg  // 16
Spacing.xl  // 20
Spacing.2xl // 24
Spacing.3xl // 32
Spacing.4xl // 40
Spacing.5xl // 48
```

**Shadows**
```typescript
Shadows.none  // No shadow
Shadows.xs    // Small
Shadows.sm    // Small-medium
Shadows.md    // Medium
Shadows.lg    // Large
Shadows.xl    // Extra large
```

**BorderRadius**
```typescript
BorderRadius.none // 0
BorderRadius.xs   // 4
BorderRadius.sm   // 8
BorderRadius.md   // 12
BorderRadius.lg   // 16
BorderRadius.xl   // 20
BorderRadius.full // 9999 (circle)
```

---

### Layout Components (components/Layout.tsx)

**Stack**
```typescript
<Stack direction="row" gap="md" align="center" justify="space-between">
  {/* Flexible layout with customizable direction and spacing */}
</Stack>
```

**Row & Column**
```typescript
<Row gap="md">...</Row>        // Horizontal stack
<Column gap="md">...</Column>   // Vertical stack
<Center>...</Center>            // Centered stack
```

**Container**
```typescript
<Container size="md" bg={Colors.background.secondary}>
  {/* Responsive container with padding */}
</Container>
```

**Spacer**
```typescript
<Spacer size="md" direction="vertical" />
<Spacer size={32} direction="horizontal" />
```

**Divider**
```typescript
<Divider color={Colors.border} thickness={1} my="lg" />
```

---

### UI Components (components/UI.tsx)

**Button**
```typescript
<Button variant="primary" size="md" fullWidth onPress={() => {}}>
  Click Me
</Button>

// Variants: primary, secondary, outline, ghost, danger
// Sizes: sm, md, lg
// With icon:
<Button icon="chevron-forward" iconPosition="right">
  Next
</Button>
```

**Card**
```typescript
<Card variant="elevated" onPress={() => {}}>
  <Text>Content</Text>
</Card>

// Variants: elevated, outlined, flat
```

**Badge**
```typescript
<Badge variant="success" size="md" icon="checkmark">
  Active
</Badge>

// Variants: primary, success, warning, danger, info, secondary
// Sizes: sm, md, lg
```

**Avatar**
```typescript
<Avatar size="md" initials="JD" />
<Avatar size="lg" source={require('image.png')} />
<Avatar size="xl" name="John Doe" />

// Sizes: sm, md, lg, xl
```

**Chip**
```typescript
<Chip
  label="Filter"
  selected={isSelected}
  onPress={() => setSelected(!isSelected)}
  onClose={() => remove()}
/>
```

**Tag**
```typescript
<Tag text="New" color={Colors.success} textColor={Colors.white} />
```

---

### Form Components (components/Form.tsx)

**FormInput**
```typescript
<FormInput
  label="Email"
  placeholder="Enter email"
  value={email}
  onChangeText={setEmail}
  error={emailError}
  icon="mail-outline"
  rightIcon="close"
  onRightIconPress={() => setEmail('')}
  keyboardType="email-address"
  helper="Enter a valid email"
  required
  maxLength={100}
/>
```

**FormSelect**
```typescript
<FormSelect
  label="Category"
  placeholder="Choose one"
  options={[
    { label: 'Option 1', value: 'opt1' },
    { label: 'Option 2', value: 'opt2' },
  ]}
  value={selected}
  onSelect={setSelected}
  error={selectedError}
  required
/>
```

**Checkbox**
```typescript
<Checkbox
  label="I agree to terms"
  checked={agreed}
  onCheck={setAgreed}
  error={agreeError}
/>
```

**RadioGroup**
```typescript
<RadioGroup
  label="Select one"
  options={[
    { label: 'Option A', value: 'a' },
    { label: 'Option B', value: 'b' },
  ]}
  value={selected}
  onSelect={setSelected}
  error={error}
/>
```

---

### Feedback Components (components/Feedback.tsx)

**Toast**
```typescript
<Toast
  message="Success!"
  type="success"  // success, error, warning, info
  duration={3000}
  action={{ label: 'Undo', onPress: () => {} }}
/>
```

**AlertDialog**
```typescript
<AlertDialog
  visible={showAlert}
  title="Confirm Delete"
  message="Are you sure?"
  icon="trash"
  buttons={[
    { label: 'Cancel', onPress: () => {}, variant: 'secondary' },
    { label: 'Delete', onPress: () => {}, variant: 'danger' },
  ]}
/>
```

**ConfirmDialog**
```typescript
<ConfirmDialog
  visible={showConfirm}
  title="Delete?"
  message="This cannot be undone"
  isDangerous
  onConfirm={handleDelete}
  onCancel={() => setShowConfirm(false)}
/>
```

**BottomSheet**
```typescript
<BottomSheet
  visible={showSheet}
  onClose={() => setShowSheet(false)}
  title="Options"
  height={screenHeight * 0.6}
>
  <Text>Content</Text>
</BottomSheet>
```

---

### Responsive Utilities (hooks/useResponsive.ts)

**useResponsive Hook**
```typescript
const {
  width,
  height,
  isSmallPhone,    // < 380
  isPhone,         // < 600
  isTablet,        // >= 600
  isLandscape,
  isPortrait,
  isSmall,         // xs
  isSmallScreen,   // sm
  isMedium,        // md
  isLarge,         // lg
  isExtraLarge,    // xl
} = useResponsive();
```

**useResponsiveValue Hook**
```typescript
const columns = useResponsiveValue({
  small: 1,
  medium: 2,
  large: 3,
  default: 2,
});
```

**Utility Functions**
```typescript
// Font sizing
const fontSize = useResponsiveFontSize(16);

// Spacing adjustment
const spacing = useResponsiveSpacing();

// Grid layout
const columns = getGridColumns(width, 150);

// Image sizing
const imgSize = getResponsiveImageSize(width, 3);

// Safe area
const insets = useSafeAreaInsets();
```

---

## Real-World Examples

### Example 1: Listing Card with New Components

```typescript
import { Card, Row, Column, Avatar, Badge, Button } from '../components/UI';
import { Spacer } from '../components/Layout';
import { Colors, Spacing } from '../theme';

export function ListingCardNew({ listing, onPress, onFavorite }) {
  return (
    <Card onPress={onPress}>
      <Column>
        {/* Image */}
        <Image
          source={{ uri: listing.imageUrl }}
          style={{ height: 200, width: '100%' }}
        />

        {/* Content */}
        <Column p={Spacing.md} gap={Spacing.md}>
          <Row justify="space-between" align="flex-start">
            <Column flex={1}>
              <Text style={{ fontSize: 18, fontWeight: '700' }}>
                {listing.title}
              </Text>
              <Spacer size="xs" />
              <Text style={{ color: Colors.text.secondary }}>
                {listing.address}
              </Text>
            </Column>
            <Badge variant="primary">{listing.rooms} өрөө</Badge>
          </Row>

          <Spacer size="sm" />

          <Row justify="space-between" align="center">
            <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.primary }}>
              ₮{listing.price.toLocaleString()}
            </Text>
            <Button
              variant="ghost"
              size="sm"
              icon={listing.isFavorite ? 'heart' : 'heart-outline'}
              onPress={() => onFavorite(listing.id)}
            >
              {listing.isFavorite ? 'Saved' : 'Save'}
            </Button>
          </Row>
        </Column>
      </Column>
    </Card>
  );
}
```

### Example 2: Login Form

```typescript
import { FormInput, Checkbox, Button } from '../components/Form';
import { Column, Spacer } from '../components/Layout';
import { useState } from 'react';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [errors, setErrors] = useState({});

  const handleLogin = async () => {
    const newErrors = {};
    if (!email) newErrors.email = 'Email required';
    if (!password) newErrors.password = 'Password required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Login logic
  };

  return (
    <Column p="lg" gap="md">
      <FormInput
        label="Email"
        placeholder="your@email.com"
        value={email}
        onChangeText={(val) => {
          setEmail(val);
          if (errors.email) setErrors({ ...errors, email: '' });
        }}
        error={errors.email}
        icon="mail"
        keyboardType="email-address"
      />

      <FormInput
        label="Password"
        placeholder="••••••"
        value={password}
        onChangeText={(val) => {
          setPassword(val);
          if (errors.password) setErrors({ ...errors, password: '' });
        }}
        error={errors.password}
        icon="lock"
        secureTextEntry
      />

      <Checkbox
        label="Remember me"
        checked={remember}
        onCheck={setRemember}
      />

      <Spacer size="md" />

      <Button variant="primary" size="lg" fullWidth onPress={handleLogin}>
        Sign In
      </Button>
    </Column>
  );
}
```

### Example 3: Responsive Grid

```typescript
import { useResponsive, getGridColumns, getResponsiveImageSize } from '../hooks/useResponsive';
import { FlatList, View } from 'react-native';

export function ListingGrid({ listings }) {
  const { width } = useResponsive();
  const columns = getGridColumns(width, 150);
  const itemSize = getResponsiveImageSize(width, columns);

  return (
    <FlatList
      data={listings}
      numColumns={columns}
      key={columns}
      renderItem={({ item }) => (
        <View style={{ width: itemSize, margin: 8 }}>
          <ListingCard listing={item} />
        </View>
      )}
    />
  );
}
```

---

## Migration from Old Components

### Old ListingCard → New Card-based approach

**Before:**
```typescript
<ListingCard
  id={1}
  title="Nice apartment"
  price={500000}
  onPress={onPress}
/>
```

**After:**
```typescript
<Card onPress={() => onPress(listing.id)}>
  <Image source={{ uri: listing.image }} style={{ height: 200 }} />
  <Column p="md">
    <Text>{listing.title}</Text>
    <Text>{listing.price}</Text>
  </Column>
</Card>
```

---

## Best Practices

1. **Always use theme values** - Don't hardcode colors/spacing
2. **Use responsive utilities** - For mobile-first design
3. **Compose components** - Combine Layout + UI + Form components
4. **Handle errors in forms** - Always display validation errors
5. **Use feedback components** - For user confirmation/feedback
6. **Test on multiple devices** - Use responsive preview

---

## Files Created

| File | Purpose | Size |
|------|---------|------|
| `theme/index.ts` | Design tokens & theme | 250 lines |
| `components/Layout.tsx` | Spacing & structure | 300 lines |
| `components/UI.tsx` | Buttons, cards, badges | 450 lines |
| `components/Form.tsx` | Inputs, selects, checkboxes | 500 lines |
| `components/Feedback.tsx` | Toasts, modals, alerts | 400 lines |
| `hooks/useResponsive.ts` | Responsive utilities | 200 lines |

**Total: 2,100+ lines of production-ready UI code**

---

## Next Steps

1. Review theme tokens in `theme/index.ts`
2. Update existing screens to use new components
3. Test on various device sizes
4. Customize colors/spacing for your brand
5. Build new screens using component library

**Start with simple components (Button, Card) and work toward complex layouts!**
