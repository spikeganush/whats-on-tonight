export interface JellyfinItem {
  Name: string;
  Id: string; // GUID
  Overview?: string;
  PremiereDate?: string; // ISO Date
  CommunityRating?: number;
  CriticRating?: number;
  ProviderIds?: {
    Tmdb?: string;
    Imdb?: string;
  };
  ImageTags?: {
    Primary?: string;
    Logo?: string;
    Thumb?: string;
  };
  GenreItems?: { Name: string; Id: string }[];
  BackdropImageTags?: string[];
  RunTimeTicks?: number;
  ProductionYear?: number;
}
