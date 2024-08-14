// Sidebar.tsx
"use client";
import React, { useContext } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { NEXT_PUBLIC_DO_NOT_USE_TOGGLE_OFF_DANSWER_POWERED } from "@/lib/constants";
import { HeaderTitle } from "@/components/header/HeaderTitle";
import { SettingsContext } from "@/components/settings/SettingsProvider";
import { BackIcon } from "@/components/icons/icons";

interface Item {
  name: string | JSX.Element;
  link: string;
}

interface Collection {
  name: string | JSX.Element;
  items: Item[];
}

export function AdminSidebar({ collections }: { collections: Collection[] }) {
  const combinedSettings = useContext(SettingsContext);
  if (!combinedSettings) {
    return null;
  }

  const settings = combinedSettings.settings;
  const enterpriseSettings = combinedSettings.enterpriseSettings;

  return (
    <div className="pl-0">
      <nav className="space-y-2 ">
        <div className="w-full justify-center mb-4 flex">
          <div className="w-52">
            <Link
              className="flex flex-col"
              href={
                settings && settings.default_page === "chat"
                  ? "/chat"
                  : "/search"
              }
            >
              <div className="max-w-[200px] flex gap-x-1 my-auto">
                <div className="flex-none mb-auto">
                  <Logo />
                </div>
                <div className="my-auto">
                  {enterpriseSettings && enterpriseSettings.application_name ? (
                    <div>
                      <HeaderTitle>
                        {enterpriseSettings.application_name}
                      </HeaderTitle>
                      {!NEXT_PUBLIC_DO_NOT_USE_TOGGLE_OFF_DANSWER_POWERED && (
                        <p className="text-xs text-subtle">
                          Powered by Danswer
                        </p>
                      )}
                    </div>
                  ) : (
                    <HeaderTitle>Danswer</HeaderTitle>
                  )}
                </div>
              </div>
            </Link>
          </div>
        </div>
        <div className="flex w-full justify-center">
          <Link href={"/chat"}>
            <button className="text-sm block w-52 py-2.5 flex px-2 text-left bg-background-200 hover:bg-background-200/80 cursor-pointer rounded">
              <BackIcon size={20} className="text-neutral" />
              <p className="ml-1">
                Back to{" "}
                {combinedSettings.enterpriseSettings?.application_name ||
                  "Danswer"}
              </p>
            </button>
          </Link>
        </div>
        {collections.map((collection, collectionInd) => (
          <div
            className="flex flex-col items-center justify-center w-full"
            key={collectionInd}
          >
            <h2 className="text-xs text-strong w-52 font-bold pb-2">
              <div>{collection.name}</div>
            </h2>
            {collection.items.map((item) => (
              <Link key={item.link} href={item.link}>
                <button className="text-sm block w-52 py-2.5 px-2 text-left hover:bg-hover rounded">
                  {item.name}
                </button>
              </Link>
            ))}
          </div>
        ))}
      </nav>
      {combinedSettings.webVersion && (
        <div
          className="flex flex-col mt-6 items-center justify-center w-full"
          key={"danswerVersion"}
        >
          <h2 className="text-xs text-text w-52 font-medium pb-2">
            Danswer version: {combinedSettings.webVersion}
          </h2>
        </div>
      )}
    </div>
  );
}
