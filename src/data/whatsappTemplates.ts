import { CampaignTemplate } from "@/features/campaigns/types";

export const whatsappTemplates: CampaignTemplate[] = [
  {
    id: "order_update",
    name: "Order Update",
    type: "text",
    text: "Hi {{name}}, your order {{orderId}} is now {{status}}. Total: Rs {{total}}. Thank you!",
  },
  {
    id: "promo_image",
    name: "Promo Image",
    type: "media",
    mediaUrl: "https://via.placeholder.com/600x400.png?text=Promo",
    mediaType: "image",
    fileName: "promo.jpg",
    caption: "Hi {{name}}, check out our latest offer!",
  },
];

export type TemplateVars = Record<string, string>;

export function renderTemplateText(text: string, vars: TemplateVars) {
  return text.replace(/{{(\w+)}}/g, (_, k) => vars[k] ?? "");
}
