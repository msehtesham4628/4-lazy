# 4LAAZY Firestore Security Specification

## Collections & Access Control

1. **`/users/{userId}`**
   - **Owner**: `request.auth.uid == userId`
   - **Admin**: Bootstrapped admin (`ehtesham4628@gmail.com` with verified email) or verified `/admins/{uid}` document
   - **Read**: Owner (`get`) or Admin (`get`, `list`). No cross-user enumeration.
   - **Create**: Owner creating own profile with `role == 'customer'` and validated field types/sizes, or Admin.
   - **Update**: Owner updating own mutable fields (`name`, `phone`, `photoURL`, `authProvider`, `isEmailVerified`, `isPhoneVerified`, `updatedAt`) with `role` immutable (`customer`), or Admin.
   - **Delete**: Admin only.

2. **`/invoices/{invoiceId}`**
   - **Owner**: `resource.data.userId == request.auth.uid`
   - **Read**: Owner (`get` / ownership-scoped `list`) or Admin.
   - **Create**: Authenticated owner (`request.resource.data.userId == request.auth.uid`) or Admin, with strict schema & positive numeric validation.
   - **Update / Delete**: Admin only (invoices are immutable for customers once issued).

3. **`/admins/{adminId}`**
   - **Read**: Self (`request.auth.uid == adminId`) or Admin.
   - **Write**: Bootstrapped Admin only.

4. **Default Deny Catch-All (`/{document=**}`)**
   - Explicitly denies all read/write access to any unspecified path.
