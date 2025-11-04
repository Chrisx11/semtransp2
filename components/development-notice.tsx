import { useEffect, useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Construction } from "lucide-react"

interface DevelopmentNoticeProps {
  pageName: string
}

export function DevelopmentNotice({ pageName }: DevelopmentNoticeProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Show the modal once when the component mounts
    setOpen(true)
  }, [])

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Construction className="h-5 w-5 text-yellow-500" />
            <AlertDialogTitle>Página em Desenvolvimento</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm">
            A página de <span className="font-semibold">{pageName}</span> está atualmente em desenvolvimento. 
            Algumas funcionalidades podem não estar totalmente disponíveis ou podem não funcionar como esperado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction asChild>
            <Button className="w-full sm:w-auto">Entendi</Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
} 