import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { EditorForm } from "@/components/editor/editor-form";
import type { Lottery } from "@/types/lottery";

export default async function EditLotteryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("lotteries")
    .select("*")
    .eq("id", id)
    .eq("clerk_user_id", userId)
    .single();

  if (error || !data) notFound();

  return <EditorForm lottery={data as Lottery} />;
}
