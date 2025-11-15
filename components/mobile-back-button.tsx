"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export function MobileBackButton() {
  return (
    <div className="w-full mb-4 pl-0 pr-0">
      <Link href="/dashboard" className="block">
        <Button variant="outline" size="sm" className="w-full justify-start gap-2 h-10 text-sm pl-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar para Início</span>
        </Button>
      </Link>
    </div>
  )
}

