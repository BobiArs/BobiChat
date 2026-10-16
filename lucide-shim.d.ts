import "lucide-react-native";

declare module "lucide-react-native" {
  import type { ForwardRefExoticComponent } from "react";
  import type { SvgProps } from "react-native-svg";

  export interface LucideProps extends SvgProps {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
    className?: string;
  }
  export type LucideIcon = ForwardRefExoticComponent<LucideProps>;

  export const User: LucideIcon;
  export const UserIcon: LucideIcon;
  export const UserPlus: LucideIcon;
  export const UserPlusIcon: LucideIcon;
  export const Video: LucideIcon;
  export const VideoIcon: LucideIcon;
  export const VideoOff: LucideIcon;
  export const X: LucideIcon;
  export const XIcon: LucideIcon;
  export const Edit3: LucideIcon;
  export const Trash2: LucideIcon;
  export const Smile: LucideIcon;
  export const MoreVertical: LucideIcon;
}
