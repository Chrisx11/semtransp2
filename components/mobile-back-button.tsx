"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export function MobileBackButton() {
  return (
    <div className="w-full min-w-0 mb-4 pl-0 pr-0 box-border">
      <Link href="/dashboard" className="block w-full min-w-0">
        <Button variant="outline" size="sm" className="w-full min-w-0 justify-start gap-2 h-10 text-sm pl-2 box-border">
          <ArrowLeft className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">Voltar para Início</span>
        </Button>
      </Link>
    </div>
  )
}

