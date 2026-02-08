export type OnboardingStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  HowItWorks: undefined;
  Register: undefined;
  Login: undefined;
  Permissions: undefined;
  QuickStart: undefined;
  DemoFeed: undefined;
};

export type PeopleStackParamList = {
  PeopleHome: undefined;
  ConnectMethods: undefined;
  InviteLink: undefined;
  HandshakeQR: undefined;
  ConfirmConnection: { connectionId: number; draft?: { body?: string; direct_user_id?: number } } | undefined;
  FirstMemoryCard: { draft?: { body?: string; direct_user_id?: number } } | undefined;
  PersonProfile: { userId: number } | undefined;
  MessageThread: { userId: number; userName?: string } | undefined;
  QuickStart: undefined;
  DemoFeed: undefined;
};

export type CirclesStackParamList = {
  CirclesHome: undefined;
  CreateCircle: undefined;
  CircleFeed: { circleId: number; circleName?: string } | undefined;
  CircleSettings: { circleId: number } | undefined;
};

export type CreateStackParamList = {
  CreateChooser: undefined;
  CreateEditor: { mode: 'text' | 'photo' | 'voice' } | undefined;
  PostSuccess: { memoryId?: number } | undefined;
};

export type VaultStackParamList = {
  VaultHome: undefined;
  AdoptedList: undefined;
  TimeCapsules: undefined;
  CreateTimeCapsule: undefined;
  OnThisDay: undefined;
};

export type InboxStackParamList = {
  InboxHome: undefined;
  AdoptionNotesList: undefined;
  Requests: undefined;
  MessageThread: { userId: number; userName?: string } | undefined;
};
