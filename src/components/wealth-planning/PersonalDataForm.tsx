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
import { Plus, Trash2, Info, CheckCircle2, AlertCircle } from "lucide-react";
import type { PersonalData, Dependent, MaritalStatus, Suitability } from "@/types/wealth-planning";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ValidationMessage } from "@/components/wealth-planning/ValidationMessage";

interface PersonalDataFormProps {
  data: PersonalData;
  onChange: (data: PersonalData) => void;
}

interface FieldErrors {
  name?: string;
  age?: string;
  retirementAge?: string;
  lifeExpectancy?: string;
  maritalStatus?: string;
  suitability?: string;
}

export default function PersonalDataForm({ data, onChange }: PersonalDataFormProps) {
  const [dependents, setDependents] = useState<Dependent[]>(data.dependents || []);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const updateData = (updates: Partial<PersonalData>) => {
    onChange({ ...data, ...updates });
  };

  const validateField = (fieldName: string, value: unknown): string => {
    switch (fieldName) {
      case "name":
        if (!value || (typeof value === "string" && value.trim() === "")) {
          return "Nome é obrigatório";
        }
        break;
      case "age":
        if (!value || (typeof value === "number" && (value <= 0 || value > 120))) {
          return "Idade deve ser entre 1 e 120 anos";
        }
        break;
      case "retirementAge":
        if (!value || (typeof value === "number" && value <= 0)) {
          return "Idade de aposentadoria é obrigatória";
        }
        if (typeof value === "number" && typeof data.age === "number" && value <= data.age) {
          return "Idade de aposentadoria deve ser maior que a idade atual";
        }
        break;
      case "lifeExpectancy":
        if (!value || (typeof value === "number" && value <= 0)) {
          return "Expectativa de vida é obrigatória";
        }
        if (typeof value === "number" && typeof data.retirementAge === "number" && value <= data.retirementAge) {
          return "Expectativa de vida deve ser maior que a idade de aposentadoria";
        }
        break;
      case "maritalStatus":
        if (!value || (typeof value === "string" && value.trim() === "")) {
          return "Estado civil é obrigatório";
        }
        break;
      case "suitability":
        if (!value || (typeof value === "string" && value.trim() === "")) {
          return "Perfil de risco é obrigatório";
        }
        break;
    }
    return "";
  };

  const handleBlur = (fieldName: string, value: unknown) => {
    setTouchedFields((prev) => new Set(prev).add(fieldName));
    const error = validateField(fieldName, value);
    setFieldErrors((prev) => ({ ...prev, [fieldName]: error }));
  };

  const handleChange = (fieldName: string, value: unknown) => {
    updateData({ [fieldName]: value } as Partial<PersonalData>);
    // Validar em tempo real se o campo já foi tocado
    if (touchedFields.has(fieldName)) {
      const error = validateField(fieldName, value);
      setFieldErrors((prev) => ({ ...prev, [fieldName]: error }));
    }
  };

  const getFieldStatus = (fieldName: string, value: unknown) => {
    if (!touchedFields.has(fieldName)) return null;
    const error = fieldErrors[fieldName as keyof FieldErrors];
    if (error) return "error";
    if (value !== undefined && value !== null && value !== "") return "success";
    return null;
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
              <div className="relative">
                <Input
                  id="name"
                  required
                  value={data.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  onBlur={(e) => handleBlur("name", e.target.value)}
                  className={`font-sans ${
                    getFieldStatus("name", data.name) === "error"
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : getFieldStatus("name", data.name) === "success"
                      ? "border-green-300 focus:border-green-500"
                      : ""
                  }`}
                  placeholder="Nome completo"
                />
                {getFieldStatus("name", data.name) === "success" && (
                  <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-600" />
                )}
                {getFieldStatus("name", data.name) === "error" && (
                  <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-600" />
                )}
              </div>
              {touchedFields.has("name") && fieldErrors.name && (
                <ValidationMessage message={fieldErrors.name} />
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
                <div className="relative">
                  <Input
                    id="age"
                    type="number"
                    required
                    min="0"
                    max="120"
                    value={data.age || ""}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      handleChange("age", val);
                    }}
                    onBlur={(e) => handleBlur("age", parseInt(e.target.value) || 0)}
                    className={`font-sans ${
                      getFieldStatus("age", data.age) === "error"
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : getFieldStatus("age", data.age) === "success"
                        ? "border-green-300 focus:border-green-500"
                        : ""
                    }`}
                    placeholder="Ex: 35"
                  />
                  {getFieldStatus("age", data.age) === "success" && (
                    <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-600" />
                  )}
                  {getFieldStatus("age", data.age) === "error" && (
                    <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-600" />
                  )}
                </div>
                {touchedFields.has("age") && fieldErrors.age && (
                  <ValidationMessage message={fieldErrors.age} />
                )}
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
                <div className="relative">
                  <Input
                    id="retirementAge"
                    type="number"
                    required
                    min="0"
                    max="120"
                    value={data.retirementAge || ""}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      handleChange("retirementAge", val);
                    }}
                    onBlur={(e) => handleBlur("retirementAge", parseInt(e.target.value) || 0)}
                    className={`font-sans ${
                      getFieldStatus("retirementAge", data.retirementAge) === "error"
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : getFieldStatus("retirementAge", data.retirementAge) === "success"
                        ? "border-green-300 focus:border-green-500"
                        : ""
                    }`}
                    placeholder="Ex: 60"
                  />
                  {getFieldStatus("retirementAge", data.retirementAge) === "success" && (
                    <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-600" />
                  )}
                  {getFieldStatus("retirementAge", data.retirementAge) === "error" && (
                    <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-600" />
                  )}
                </div>
                {touchedFields.has("retirementAge") && fieldErrors.retirementAge && (
                  <ValidationMessage message={fieldErrors.retirementAge} />
                )}
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
                <div className="relative">
                  <Input
                    id="lifeExpectancy"
                    type="number"
                    required
                    min="0"
                    max="120"
                    value={data.lifeExpectancy || ""}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      handleChange("lifeExpectancy", val);
                    }}
                    onBlur={(e) => handleBlur("lifeExpectancy", parseInt(e.target.value) || 0)}
                    className={`font-sans ${
                      getFieldStatus("lifeExpectancy", data.lifeExpectancy) === "error"
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : getFieldStatus("lifeExpectancy", data.lifeExpectancy) === "success"
                        ? "border-green-300 focus:border-green-500"
                        : ""
                    }`}
                    placeholder="Ex: 85"
                  />
                  {getFieldStatus("lifeExpectancy", data.lifeExpectancy) === "success" && (
                    <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-600" />
                  )}
                  {getFieldStatus("lifeExpectancy", data.lifeExpectancy) === "error" && (
                    <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-600" />
                  )}
                </div>
                {touchedFields.has("lifeExpectancy") && fieldErrors.lifeExpectancy && (
                  <ValidationMessage message={fieldErrors.lifeExpectancy} />
                )}
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
              <div className="relative">
                <Select
                  value={data.maritalStatus}
                  onValueChange={(value) => {
                    handleChange("maritalStatus", value);
                    handleBlur("maritalStatus", value);
                  }}
                >
                  <SelectTrigger 
                    className={`font-sans w-full ${
                      getFieldStatus("maritalStatus", data.maritalStatus) === "error"
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : getFieldStatus("maritalStatus", data.maritalStatus) === "success"
                        ? "border-green-300 focus:border-green-500"
                        : ""
                    }`}
                  >
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
                {getFieldStatus("maritalStatus", data.maritalStatus) === "success" && (
                  <CheckCircle2 className="absolute right-10 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-600 pointer-events-none" />
                )}
                {getFieldStatus("maritalStatus", data.maritalStatus) === "error" && (
                  <AlertCircle className="absolute right-10 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-600 pointer-events-none" />
                )}
              </div>
              {touchedFields.has("maritalStatus") && fieldErrors.maritalStatus && (
                <ValidationMessage message={fieldErrors.maritalStatus} />
              )}
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
              <div className="relative">
                <Select
                  value={data.suitability}
                  onValueChange={(value) => {
                    handleChange("suitability", value);
                    handleBlur("suitability", value);
                  }}
                >
                  <SelectTrigger 
                    className={`font-sans w-full ${
                      getFieldStatus("suitability", data.suitability) === "error"
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : getFieldStatus("suitability", data.suitability) === "success"
                        ? "border-green-300 focus:border-green-500"
                        : ""
                    }`}
                  >
                    <SelectValue placeholder="Selecione o perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Conservador">Conservador</SelectItem>
                    <SelectItem value="Moderado">Moderado</SelectItem>
                    <SelectItem value="Moderado-Agressivo">Moderado-Agressivo</SelectItem>
                    <SelectItem value="Agressivo">Agressivo</SelectItem>
                  </SelectContent>
                </Select>
                {getFieldStatus("suitability", data.suitability) === "success" && (
                  <CheckCircle2 className="absolute right-10 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-600 pointer-events-none" />
                )}
                {getFieldStatus("suitability", data.suitability) === "error" && (
                  <AlertCircle className="absolute right-10 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-600 pointer-events-none" />
                )}
              </div>
              {touchedFields.has("suitability") && fieldErrors.suitability && (
                <ValidationMessage message={fieldErrors.suitability} />
              )}
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
                Clique em &quot;Adicionar Dependente&quot; para incluir familiares dependentes
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

