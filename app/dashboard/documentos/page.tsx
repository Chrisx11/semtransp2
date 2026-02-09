"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Upload,
  Search,
  Eye,
  Trash2,
  FileText,
  Download,
  X,
  Loader2,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { DeleteConfirmation } from "@/components/delete-confirmation"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import {
  getDocumentosSupabase,
  buscarDocumentosSupabase,
  uploadMultiplosDocumentosSupabase,
  deleteDocumentoSupabase,
  getDocumentoUrl,
  getDocumentoUrlAssinadaParaView,
  formatarTamanho,
  type Documento,
} from "@/services/documento-service"
import { useIsMobile } from "@/components/ui/use-mobile"
import { MobileBackButton } from "@/components/mobile-back-button"

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100]

export default function DocumentosPage() {
  const isMobile = useIsMobile()
  const { toast } = useToast()
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedDocumento, setSelectedDocumento] = useState<Documento | null>(null)
  const [documentoUrl, setDocumentoUrl] = useState<string>("")
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [documentoToDelete, setDocumentoToDelete] = useState<Documento | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Carregar documentos
  useEffect(() => {
    loadDocumentos()
  }, [])

  const loadDocumentos = async () => {
    try {
      setIsLoading(true)
      const data = await getDocumentosSupabase()
      setDocumentos(data)
    } catch (error) {
      console.error("Erro ao carregar documentos:", error)
      toast({
        title: "Erro ao carregar documentos",
        description: "Não foi possível carregar os documentos.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Filtrar documentos
  const filteredDocumentos = useMemo(() => {
    if (!searchTerm.trim()) {
      return documentos
    }

    const termo = searchTerm.toLowerCase()
    return documentos.filter(
      (doc) =>
        doc.nome.toLowerCase().includes(termo) ||
        doc.nome_arquivo.toLowerCase().includes(termo) ||
        (doc.descricao && doc.descricao.toLowerCase().includes(termo))
    )
  }, [documentos, searchTerm])

  // Paginação
  const totalPages = Math.ceil(filteredDocumentos.length / itemsPerPage)
  const paginatedDocumentos = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return filteredDocumentos.slice(start, end)
  }, [filteredDocumentos, currentPage, itemsPerPage])

  // Resetar página quando termo de busca mudar
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  // Upload de arquivos
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    // Validar que são PDFs
    const pdfFiles = Array.from(files).filter((file) => file.type === "application/pdf")
    if (pdfFiles.length === 0) {
      toast({
        title: "Erro",
        description: "Apenas arquivos PDF são permitidos.",
        variant: "destructive",
      })
      return
    }

    if (pdfFiles.length < files.length) {
      toast({
        title: "Aviso",
        description: `${files.length - pdfFiles.length} arquivo(s) não PDF foram ignorados.`,
      })
    }

    try {
      setIsUploading(true)
      setUploadProgress(0)

      const novosDocumentos = await uploadMultiplosDocumentosSupabase(
        pdfFiles,
        (progress) => {
          setUploadProgress(progress)
        }
      )

      toast({
        title: "Upload concluído",
        description: `${novosDocumentos.length} documento(s) enviado(s) com sucesso.`,
      })

      // Recarregar lista
      await loadDocumentos()

      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error: any) {
      console.error("Erro ao fazer upload:", error)
      
      let errorMessage = error.message || "Não foi possível fazer upload dos documentos."
      
      // Mensagem mais amigável para bucket não encontrado
      if (error.message?.includes("Bucket not found") || error.message?.includes("bucket")) {
        errorMessage = "Bucket 'documentos' não encontrado. Por favor, crie o bucket no Supabase Dashboard > Storage antes de fazer upload."
      }
      
      // Mensagem mais amigável para erro de RLS
      if (error.message?.includes("row-level security") || error.message?.includes("RLS") || error.message?.includes("policy") || error.message?.includes("permissão")) {
        errorMessage = "Erro de permissão no Supabase Storage. Execute o arquivo 'db/create-documentos-storage-policies.sql' no Supabase SQL Editor para configurar as políticas de acesso."
      }
      
      toast({
        title: "Erro ao fazer upload",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  // Visualizar documento
  const handleView = async (documento: Documento) => {
    setSelectedDocumento(documento)
    setIsViewerOpen(true)
    // Tentar obter URL assinada primeiro, depois fallback para pública
    try {
      const url = await getDocumentoUrlAssinadaParaView(documento.caminho_arquivo)
      setDocumentoUrl(url)
    } catch (error) {
      // Fallback para URL pública
      setDocumentoUrl(getDocumentoUrl(documento.caminho_arquivo))
    }
  }

  // Deletar documento
  const handleDeleteClick = (documento: Documento) => {
    setDocumentoToDelete(documento)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!documentoToDelete) return

    try {
      await deleteDocumentoSupabase(documentoToDelete.id)
      toast({
        title: "Documento deletado",
        description: "O documento foi removido com sucesso.",
      })
      await loadDocumentos()
    } catch (error) {
      console.error("Erro ao deletar documento:", error)
      toast({
        title: "Erro ao deletar",
        description: "Não foi possível deletar o documento.",
        variant: "destructive",
      })
    } finally {
      setIsDeleteDialogOpen(false)
      setDocumentoToDelete(null)
    }
  }

  // Formatar data
  const formatarData = (dataString: string) => {
    try {
      const data = new Date(dataString)
      return data.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return "—"
    }
  }

  if (isMobile) {
    return (
      <div className="container mx-auto p-4 space-y-4">
        <MobileBackButton />
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Documentos</h1>
        </div>

        {/* Barra de pesquisa e upload */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar documentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando... {Math.round(uploadProgress)}%
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Lista de documentos mobile */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : paginatedDocumentos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum documento encontrado</h3>
              <p className="text-sm text-muted-foreground text-center">
                {searchTerm
                  ? "Tente ajustar os termos de busca."
                  : "Faça upload de documentos PDF para começar."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {paginatedDocumentos.map((doc) => (
              <Card key={doc.id}>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{doc.nome}</h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {doc.nome_arquivo}
                        </p>
                      </div>
                    </div>
                    {doc.descricao && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {doc.descricao}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatarTamanho(doc.tamanho)}</span>
                      <span>{formatarData(doc.created_at)}</span>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(doc)}
                        className="flex-1"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Visualizar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(doc)}
                        className="flex-1"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Deletar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Paginação mobile */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Próxima
            </Button>
          </div>
        )}

        {/* Dialog de visualização */}
        <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>{selectedDocumento?.nome}</DialogTitle>
              <DialogDescription>{selectedDocumento?.nome_arquivo}</DialogDescription>
            </DialogHeader>
            {selectedDocumento && documentoUrl && (
              <div className="w-full h-[70vh]">
                <iframe
                  src={documentoUrl}
                  className="w-full h-full border rounded"
                  title={selectedDocumento.nome}
                />
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmação de exclusão */}
        <DeleteConfirmation
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          onConfirm={handleDeleteConfirm}
          title="Deletar documento"
          description={`Tem certeza que deseja deletar "${documentoToDelete?.nome}"? Esta ação não pode ser desfeita.`}
        />

        <Toaster />
      </div>
    )
  }

  // Versão desktop
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documentos</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie seus documentos PDF
          </p>
        </div>
        <div className="flex items-center gap-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando... {Math.round(uploadProgress)}%
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Barra de pesquisa */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar documentos por nome, arquivo ou descrição..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabela de documentos */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : paginatedDocumentos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum documento encontrado</h3>
            <p className="text-sm text-muted-foreground text-center">
              {searchTerm
                ? "Tente ajustar os termos de busca."
                : "Faça upload de documentos PDF para começar."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Arquivo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Data de Upload</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedDocumentos.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.nome}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {doc.nome_arquivo}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {doc.descricao || "—"}
                    </TableCell>
                    <TableCell>{formatarTamanho(doc.tamanho)}</TableCell>
                    <TableCell>{formatarData(doc.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleView(doc)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const url = getDocumentoUrl(doc.caminho_arquivo)
                            window.open(url, "_blank")
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(doc)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Paginação e itens por página */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Itens por página:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }

                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        onClick={() => setCurrentPage(pageNum)}
                        isActive={currentPage === pageNum}
                        className="cursor-pointer"
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  )
                })}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>

            <div className="text-sm text-muted-foreground">
              Mostrando {paginatedDocumentos.length} de {filteredDocumentos.length} documento(s)
            </div>
          </div>
        </>
      )}

      {/* Dialog de visualização */}
      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedDocumento?.nome}</DialogTitle>
            <DialogDescription>{selectedDocumento?.nome_arquivo}</DialogDescription>
          </DialogHeader>
          {selectedDocumento && documentoUrl && (
            <div className="w-full h-[75vh]">
              <iframe
                src={documentoUrl}
                className="w-full h-full border rounded"
                title={selectedDocumento.nome}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão */}
      <DeleteConfirmation
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Deletar documento"
        description={`Tem certeza que deseja deletar "${documentoToDelete?.nome}"? Esta ação não pode ser desfeita.`}
      />

      <Toaster />
    </div>
  )
}
