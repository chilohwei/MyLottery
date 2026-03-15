import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { nanoid } from "@/lib/nanoid";

export default async function NewLotteryPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const supabase = createServerClient();
  const slug = nanoid(8);

  const { data, error } = await supabase
    .from("lotteries")
    .insert({
      clerk_user_id: userId,
      slug,
      title: "我的抽奖活动",
      status: "draft",
      config: {
        gameType: "wheel",
        slides: ["这是我为你准备的一份小惊喜\n愿你收到时，刚好有一点开心"],
        senderName: "",
        senderAvatar: "",
        recipientPhoto: "",
        gifts: [
          { id: crypto.randomUUID(), text: "影视会员年卡", icon: "🎬" },
          { id: crypto.randomUUID(), text: "电影票 2 张", icon: "🎟️" },
          { id: crypto.randomUUID(), text: "红包 188 元", icon: "💸" },
          { id: crypto.randomUUID(), text: "请吃一顿大餐", icon: "🍰" },
        ],
        showPrizeList: false,
        allowRetry: false,
        shareMode: "public",
        sharePasscode: "",
        decorEmojis: ["🎉", "🎊", "✨", "🌟", "💫"],
      },
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Failed to create lottery: ${error.message}`);
  }

  redirect(`/lottery/${data.id}/edit`);
}
