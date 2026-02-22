"use client";

import { useState, useEffect } from "react";
import type { Product, Section } from "@/lib/types";

interface ProductFormModalProps {
    product?: Product | null;
    onClose: () => void;
    onSaved: () => void;
}

const IVA_RATE = 0.16; // 16% IVA

export default function ProductFormModal({ product, onClose, onSaved }: ProductFormModalProps) {
    const isEdit = !!product;
    const [form, setForm] = useState({
        name: "",
        description: "",
        sectionId: 0,
        price: "",
        unit: "kg",
        imageUrl: "",
        sku: "",
        location: "",
        taxType: "gravado" as "gravado" | "exento",
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [sections, setSections] = useState<Section[]>([]);

    useEffect(() => {
        fetch("/api/sections")
            .then((r) => r.json())
            .then((d) => {
                setSections(d.sections || []);
                if (!product && d.sections?.length) {
                    setForm((f) => ({ ...f, sectionId: d.sections[0].id }));
                }
            })
            .catch(() => { });
    }, []);

    useEffect(() => {
        if (product) {
            setForm({
                name: product.name,
                description: product.description || "",
                sectionId: product.sectionId || 0,
                price: product.price,
                unit: product.unit || "kg",
                imageUrl: product.imageUrl || "",
                sku: product.sku || "",
                location: product.location || "",
                taxType: (product.taxType as "gravado" | "exento") || "gravado",
            });
        }
    }, [product]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSaving(true);

        try {
            const url = "/api/products";
            const method = isEdit ? "PATCH" : "POST";
            const body = isEdit
                ? { id: product!.id, ...form }
                : form;

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            onSaved();
            onClose();
        } catch (err: any) {
            setError(err.message || "Error al guardar");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!product || !confirm("¿Estás seguro de eliminar este producto?")) return;

        try {
            const res = await fetch(`/api/products?id=${product.id}`, { method: "DELETE" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            onSaved();
            onClose();
        } catch (err: any) {
            setError(err.message || "Error al eliminar");
        }
    };

    // Calculate IVA
    const priceNum = parseFloat(form.price) || 0;
    const ivaAmount = form.taxType === "gravado" ? priceNum * IVA_RATE : 0;
    const totalWithIva = priceNum + ivaAmount;

    const inputClass = "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all";
    const labelClass = "text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block";
    const selectClass = "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-primary/50 transition-all";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-[#0f172a] border border-white/10 rounded-3xl p-6 max-h-[90vh] overflow-y-auto shadow-2xl backdrop-blur-xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-black text-white">
                        {isEdit ? "Editar Producto" : "Nuevo Producto"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="h-8 w-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                        <span className="material-symbols-outlined text-slate-400 text-[18px]">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className={labelClass}>Nombre *</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            required
                            className={inputClass}
                            placeholder="Ej: Producto o Artículo"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className={labelClass}>Descripción</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            rows={2}
                            className={`${inputClass} resize-none`}
                            placeholder="Descripción opcional"
                        />
                    </div>

                    {/* Sección + Unit row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelClass}>Sección *</label>
                            <select
                                value={form.sectionId}
                                onChange={(e) => setForm({ ...form, sectionId: parseInt(e.target.value) })}
                                className={selectClass}
                            >
                                {sections.map((s) => (
                                    <option key={s.id} value={s.id} className="bg-[#0f172a]">{s.emoji} {s.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Unidad</label>
                            <select
                                value={form.unit}
                                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                                className={selectClass}
                            >
                                <option value="kg" className="bg-[#0f172a]">Kilogramo (kg)</option>
                                <option value="lb" className="bg-[#0f172a]">Libra (lb)</option>
                                <option value="unidad" className="bg-[#0f172a]">Unidad</option>
                                <option value="paquete" className="bg-[#0f172a]">Paquete</option>
                            </select>
                        </div>
                    </div>

                    {/* Price + Tax Type row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelClass}>Precio USD *</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={form.price}
                                onChange={(e) => setForm({ ...form, price: e.target.value })}
                                required
                                className={inputClass}
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Tipo Fiscal *</label>
                            <select
                                value={form.taxType}
                                onChange={(e) => setForm({ ...form, taxType: e.target.value as "gravado" | "exento" })}
                                className={selectClass}
                            >
                                <option value="gravado" className="bg-[#0f172a]">Gravado (IVA 16%)</option>
                                <option value="exento" className="bg-[#0f172a]">Exento (sin IVA)</option>
                            </select>
                        </div>
                    </div>

                    {/* IVA calculation preview */}
                    {priceNum > 0 && (
                        <div className={`rounded-xl p-3 border ${form.taxType === "gravado" ? "bg-blue-500/10 border-blue-500/20" : "bg-amber-500/10 border-amber-500/20"}`}>
                            <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-slate-400">Precio base</span>
                                <span className="font-bold text-white">${priceNum.toFixed(2)}</span>
                            </div>
                            {form.taxType === "gravado" && (
                                <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="text-slate-400">IVA (16%)</span>
                                    <span className="font-bold text-blue-400">+${ivaAmount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex items-center justify-between text-sm pt-1 border-t border-white/10">
                                <span className="font-bold text-white">Total</span>
                                <span className="font-extrabold text-primary">${totalWithIva.toFixed(2)}</span>
                            </div>
                            {form.taxType === "exento" && (
                                <p className="text-[10px] text-amber-400 mt-1 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[12px]">info</span>
                                    Este producto está exento de IVA
                                </p>
                            )}
                        </div>
                    )}

                    {/* SKU + Location */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelClass}>SKU</label>
                            <input
                                type="text"
                                value={form.sku}
                                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                                className={inputClass}
                                placeholder="Opcional"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Ubicación</label>
                            <input
                                type="text"
                                value={form.location}
                                onChange={(e) => setForm({ ...form, location: e.target.value })}
                                className={inputClass}
                                placeholder="Ej: Vitrina A"
                            />
                        </div>
                    </div>

                    {/* Image URL */}
                    <div>
                        <label className={labelClass}>URL de Imagen</label>
                        <input
                            type="url"
                            value={form.imageUrl}
                            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                            className={inputClass}
                            placeholder="https://..."
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium rounded-xl p-3">
                            <span className="material-symbols-outlined text-[16px]">error</span>
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        {isEdit && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold hover:bg-red-500/20 transition-all"
                            >
                                Eliminar
                            </button>
                        )}
                        <div className="flex-1" />
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-sm font-bold hover:bg-white/10 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-emerald-400 text-[#0f172a] text-sm font-black shadow-[0_4px_12px_rgba(19,236,91,0.25)] hover:brightness-110 transition-all disabled:opacity-50"
                        >
                            {saving ? "Guardando..." : isEdit ? "Actualizar" : "Crear"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
