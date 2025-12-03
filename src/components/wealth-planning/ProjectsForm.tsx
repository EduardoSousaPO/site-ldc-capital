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
import { Plus, Trash2 } from "lucide-react";
import type { Projects, Project, ProjectType } from "@/types/wealth-planning";

interface ProjectsFormProps {
  data: Projects;
  onChange: (data: Projects) => void;
}

export default function ProjectsForm({ data, onChange }: ProjectsFormProps) {
  const [items, setItems] = useState<Project[]>(data.items || []);

  const addProject = () => {
    const newProject: Project = {
      type: "Pessoal",
      name: "",
      amount: 0,
      deadline: 0,
    };
    const updated = [...items, newProject];
    setItems(updated);
    onChange({ items: updated });
  };

  const removeProject = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    onChange({ items: updated });
  };

  const updateProject = (index: number, updates: Partial<Project>) => {
    const updated = items.map((project, i) =>
      i === index ? { ...project, ...updates } : project
    );
    setItems(updated);
    onChange({ items: updated });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label className="font-sans font-medium">
            Projetos Pessoais e Familiares
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addProject}
            className="font-sans"
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Projeto
          </Button>
        </div>

        {items.length === 0 ? (
          <p className="text-sm text-gray-500 font-sans text-center py-4">
            Nenhum projeto adicionado
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((project, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 border rounded-lg"
              >
                <div className="space-y-1">
                  <Label className="text-xs font-sans">Tipo</Label>
                  <Select
                    value={project.type}
                    onValueChange={(value) =>
                      updateProject(index, { type: value as ProjectType })
                    }
                  >
                    <SelectTrigger className="font-sans text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pessoal">Pessoal</SelectItem>
                      <SelectItem value="Familiar">Familiar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-sans">Nome</Label>
                  <Input
                    value={project.name}
                    onChange={(e) =>
                      updateProject(index, { name: e.target.value })
                    }
                    className="font-sans text-sm"
                    placeholder="Nome do projeto"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-sans">Montante (R$)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={project.amount || ""}
                    onChange={(e) =>
                      updateProject(index, {
                        amount: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="font-sans text-sm"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-sans">Prazo (anos)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={project.deadline || ""}
                    onChange={(e) =>
                      updateProject(index, {
                        deadline: parseInt(e.target.value) || 0,
                      })
                    }
                    className="font-sans text-sm"
                    placeholder="0"
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeProject(index)}
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
  );
}

