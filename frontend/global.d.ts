// CSS 파일 side-effect import 타입 지원
declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
}
