# OmsimSocial Core v2 Wireframes (Figma-ready)

## Global UI
- Bottom Tabs: People | Circles | Create | Vault | Inbox
- Core component: MemoryCard (author, timestamp, body/media, quick reacts, Adopt)
- Adopt Modal: note (optional), visibility toggle (private/shared), CTA Adopt

## Onboarding
1. Splash
   - Logo centered, tagline, auto-advance
2. Welcome
   - Title, short explainer, CTA Create Account, CTA Sign In, link How it works
3. How it works carousel
   - Card 1: Connect (Handshake QR, Invite Link, Event QR)
   - Card 2: Memories (Circle/Direct/Private)
   - Card 3: Adopt (save + note to Vault)
4. Register
   - Name, Username, Email optional, Password + confirm, CTA Create
5. Login
   - Identifier, Password, CTA Sign in
6. Permissions
   - Contacts optional, Notifications recommended, Camera optional
   - CTA Continue
7. QuickStart Missions
   - Progress bar 0/3 -> 3/3
   - Mission cards: Create 1 Circle, Invite 3, Post 1 Memory
8. Demo Feed
   - Sample MemoryCards with tooltips
   - Shown until user has 1 real memory OR 1 connection

## People
10. PeopleHome
   - Segments: Pending / Recent / All
   - Search bar
   - CTA Connect
   - Empty state CTA Connect
11. ConnectMethods
   - Cards: Handshake, Invite Link, Event QR
   - Invite code input + CTA Accept
12. InviteLink
   - Generated code + share button
   - Pending list
13. HandshakeQR
   - QR code display + scan prompt + confirm
14. ConfirmConnection
   - Type: Friend/Family/Work/Community
   - Level: Acquaintance/Friend/Inner
15. FirstMemoryCard
   - Auto-draft card, CTA Post to Circle, CTA Send to Person
16. PersonProfile
   - Tabs: Memories | Shared Vault | About
   - CTA Message, Mute, Block

## Circles
20. CirclesHome
   - Search + list
   - CTA Create Circle
21. CreateCircle
   - Name, icon, invite-only toggle
   - Add members
22. CircleFeed
   - Optional prompt card
   - Memory list + composer
23. CircleSettings
   - Roles/permissions
   - Prompt cadence

## Create
30. CreateChooser
   - Photo/Video, Text, Voice
31. CreateEditor
   - Tag people
   - Choose circle/person/private
   - Non-shareable default for circles
   - CTA Post
32. PostSuccess
   - CTA Ask for Adoption Note
   - CTA Share circle invite

## Vault
40. VaultHome
   - Sections: Adopted, Time Capsules, By People, By Circles, On This Day
   - Search
41. AdoptedList
   - Filters and list
42. TimeCapsules
   - List + CTA Create
43. CreateTimeCapsule
   - Select memories, unlock date, recipients, schedule

## Inbox
50. InboxHome
   - Tabs: Messages | Adoption Notes | Requests
51. AdoptionNotesList
   - Note + memory link
52. MessageThread
   - Thread view + composer
53. Requests
   - Accept/Decline connection invites
