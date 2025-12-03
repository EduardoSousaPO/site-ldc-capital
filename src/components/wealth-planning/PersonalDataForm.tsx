"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Info } from "lucide-react";
import type { PersonalData, Dependent, MaritalStatus, Suitability } from "@/types/wealth-planning";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PersonalDataFormProps {
  data: PersonalData;
  onChange: (data: PersonalData) => void;
}

export default function PersonalDataForm({ data, onChange }: PersonalDataFormProps) {
  const [dependents, setDependents] = useState<Dependent[]>(data.dependents || []);

  const updateData = (updates: Partial<PersonalData>) => {
    onChange({ ...data, ...updates });
  };

  const addDependent = () => {
    const newDependent: Dependent = { name: "", age: 0 };
    const updated = [...dependents, newDependent];
    setDependents(updated);
    updateData({ dependents: updated });
  };

  const removeDependent = (index: number) => {
    const updated = dependents.filter((_, i) => i !== index);
    setDependents(updated);
    updateData({ dependents: updated });
  };

  const updateDependent = (index: number, updates: Partial<Dependent>) => {
    const updated = dependents.map((dep, i) =>
      i === index ? { ...dep, ...updates } : dep
    );
    setDependents(updated);
    updateData({ dependents: updated });
  };

  return (
    <TooltipProvider>
      <div className="space-y-8">
        {/* Informações Básicas */}
        <div className="bg-[#e3e3e3]/20 border border-[#e3e3e3] rounded-lg p-6">
          <h3 className="font-semibold text-[#262d3d] mb-4 font-sans text-base uppercase tracking-wide">
            Informações Básicas
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="name" className="font-sans font-medium">
                  Nome do Cliente *
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-sans text-sm">Nome completo do cliente para identificação do cenário</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="name"
                required
                value={data.name}
                onChange={(e) => updateData({ name: e.target.value })}
                className={`font-sans ${!data.name?.trim() ? "border-red-300 focus:border-red-500" : ""}`}
                placeholder="Nome completo"
              />
              {!data.name?.trim() && (
                <p className="text-xs text-red-600 font-sans">Nome é obrigatório</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="age" className="font-sans font-medium">
                    Idade Atual (anos) *
                  </Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-sans text-sm">Idade atual do cliente em anos</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="age"
                  type="number"
                  required
                  min="0"
                  max="120"
                  value={data.age || ""}
                  onChange={(e) => updateData({ age: parseInt(e.target.value) || 0 })}
                  className="font-sans"
                  placeholder="Ex: 35"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="retirementAge" className="font-sans font-medium">
                    Idade de Aposentadoria (anos) *
                  </Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-sans text-sm">Idade em que o cliente planeja se aposentar. Deve ser maior que a idade atual.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="retirementAge"
                  type="number"
                  required
                  min="0"
                  max="120"
                  value={data.retirementAge || ""}
                  onChange={(e) =>
                    updateData({ retirementAge: parseInt(e.target.value) || 0 })
                  }
                  className="font-sans"
                  placeholder="Ex: 60"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="lifeExpectancy" className="font-sans font-medium">
                    Expectativa de Vida (anos) *
                  </Label>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-sans text-sm">Expectativa de vida do cliente. Deve ser maior que a idade de aposentadoria.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="lifeExpectancy"
                  type="number"
                  required
                  min="0"
                  max="120"
                  value={data.lifeExpectancy || ""}
                  onChange={(e) =>
                    updateData({ lifeExpectancy: parseInt(e.target.value) || 0 })
                  }
                  className="font-sans"
                  placeholder="Ex: 85"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Perfil e Estado Civil */}
        <div className="bg-[#e3e3e3]/20 border border-[#e3e3e3] rounded-lg p-6 mt-6">
          <h3 className="font-semibold text-[#262d3d] mb-4 font-sans text-base uppercase tracking-wide">
            Perfil e Características
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="maritalStatus" className="font-sans font-medium">
                  Estado Civil *
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-sans text-sm">Estado civil atual do cliente</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select
                value={data.maritalStatus}
                onValueChange={(value) =>
                  updateData({ maritalStatus: value as MaritalStatus })
                }
              >
                <SelectTrigger className="font-sans w-full">
                  <SelectValue placeholder="Selecione o estado civil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Solteiro">Solteiro</SelectItem>
                  <SelectItem value="Casado">Casado</SelectItem>
                  <SelectItem value="Divorciado">Divorciado</SelectItem>
                  <SelectItem value="União Estável">União Estável</SelectItem>
                  <SelectItem value="Viúvo">Viúvo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="suitability" className="font-sans font-medium">
                  Perfil de Risco (Suitability) *
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-sans text-sm">Perfil de risco do cliente conforme análise de suitability</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select
                value={data.suitability}
                onValueChange={(value) =>
                  updateData({ suitability: value as Suitability })
                }
              >
                <SelectTrigger className="font-sans w-full">
                  <SelectValue placeholder="Selecione o perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Conservador">Conservador</SelectItem>
                  <SelectItem value="Moderado">Moderado</SelectItem>
                  <SelectItem value="Moderado-Agressivo">Moderado-Agressivo</SelectItem>
                  <SelectItem value="Agressivo">Agressivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Informações Adicionais */}
        <div className="bg-[#e3e3e3]/20 border border-[#e3e3e3] rounded-lg p-6 mt-6">
          <h3 className="font-semibold text-[#262d3d] mb-4 font-sans text-base uppercase tracking-wide">
            Informações Adicionais
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="profession" className="font-sans font-medium">
                  Profissão
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-sans text-sm">Profissão atual do cliente</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="profession"
                value={data.profession || ""}
                onChange={(e) => updateData({ profession: e.target.value })}
                className="font-sans"
                placeholder="Profissão atual (opcional)"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="healthStatus" className="font-sans font-medium">
                  Estado de Saúde / Expectativa de Longevidade
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-sans text-sm">
                      Condições médicas e hábitos de vida ajudam a estimar quantos anos a renda precisará sustentar. 
                      Uma boa prática é planejar pelo menos 20 anos de aposentadoria.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="healthStatus"
                value={data.healthStatus || ""}
                onChange={(e) => updateData({ healthStatus: e.target.value })}
                className="font-sans"
                placeholder="Ex: Boa saúde, sem condições crônicas (opcional)"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="otherAdvisors" className="font-sans font-medium">
                  Outros Profissionais que Assessoram
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-sans text-sm">
                      Advogados, contadores ou outros consultores que possam influenciar o plano
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="otherAdvisors"
                value={data.otherAdvisors || ""}
                onChange={(e) => updateData({ otherAdvisors: e.target.value })}
                className="font-sans"
                placeholder="Ex: Advogado, Contador (opcional)"
              />
            </div>
          </div>
        </div>

        {/* Dependentes */}
        <div className="bg-[#e3e3e3]/20 border border-[#e3e3e3] rounded-lg p-6 mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-[#262d3d] font-sans text-base uppercase tracking-wide">
              Dependentes
            </h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addDependent}
              className="font-sans bg-[#98ab44] hover:bg-[#98ab44]/90 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Dependente
            </Button>
          </div>

          {dependents.length === 0 ? (
            <div className="text-center py-8 bg-white rounded-lg border-2 border-dashed border-[#e3e3e3]">
              <p className="text-sm text-[#577171] font-sans">
                Nenhum dependente adicionado
              </p>
              <p className="text-xs text-[#577171]/70 font-sans mt-1">
                Clique em "Adicionar Dependente" para incluir familiares dependentes
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {dependents.map((dependent, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
                >
                <div className="space-y-1">
                  <Label className="text-xs font-sans">Nome</Label>
                  <Input
                    value={dependent.name}
                    onChange={(e) =>
                      updateDependent(index, { name: e.target.value })
                    }
                    className="font-sans text-sm"
                    placeholder="Nome"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-sans">Idade</Label>
                  <Input
                    type="number"
                    min="0"
                    value={dependent.age || ""}
                    onChange={(e) =>
                      updateDependent(index, {
                        age: parseInt(e.target.value) || 0,
                      })
                    }
                    className="font-sans text-sm"
                    placeholder="Idade"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-sans">Observações</Label>
                  <Input
                    value={dependent.observations || ""}
                    onChange={(e) =>
                      updateDependent(index, { observations: e.target.value })
                    }
                    className="font-sans text-sm"
                    placeholder="Observações"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeDependent(index)}
                    className="font-sans text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

