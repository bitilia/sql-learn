import { ICONS, type IconName } from "../icons/icons";

type IconProps = {
  name: IconName;
  size?: 16 | 20 | 24;
  className?: string;
};

export function Icon({ name, size = 20, className }: IconProps) {
  const icon = ICONS[name];
  return (
    <svg
      className={className ? `icon ${className}` : "icon"}
      width={size}
      height={size}
      viewBox={icon.viewBox}
      fill="none"
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: icon.body }}
    />
  );
}

export type { IconName };
