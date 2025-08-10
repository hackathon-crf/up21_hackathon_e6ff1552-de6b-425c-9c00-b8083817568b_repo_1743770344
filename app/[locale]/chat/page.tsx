"use client";

import type { NextPage } from "next";
import { ChatPageWrapper } from "./chat-page-content";

const Page: NextPage = () => {
	return <ChatPageWrapper initialSessionId={undefined} />;
};

export default Page;
