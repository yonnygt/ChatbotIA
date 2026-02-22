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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-white border border-gray-200 rounded-3xl p-6 max-h-[90vh] overflow-y-auto shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-extrabold text-gray-900">
                        {isEdit ? "Editar Producto" : "Nuevo Producto"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="h-8 w-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                        <span className="material-symbols-outlined text-gray-500 text-[18px]">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Nombre *</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            required
                            className="w-full px-4 py-2.5 rounded-xl bg-[#f3f6f4] border border-gray-200 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                            placeholder="Ej: Producto o Artículo"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Descripción</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            rows={2}
                            className="w-full px-4 py-2.5 rounded-xl bg-[#f3f6f4] border border-gray-200 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all resize-none"
                            placeholder="Descripción opcional"
                        />
                    </div>

                    {/* Sección + Unit row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Sección *</label>
                            <select
                                value={form.sectionId}
                                onChange={(e) => setForm({ ...form, sectionId: parseInt(e.target.value) })}
                                className="w-full px-4 py-2.5 rounded-xl bg-[#f3f6f4] border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-primary/50 transition-all"
                            >
                                {sections.map((s) => (
                                    <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Unidad</label>
                            <select
                                value={form.unit}
                                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl bg-[#f3f6f4] border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-primary/50 transition-all"
                            >
                                <option value="kg">Kilogramo (kg)</option>
                                <option value="lb">Libra (lb)</option>
                                <option value="unidad">Unidad</option>
                                <option value="paquete">Paquete</option>
                            </select>
                        </div>
                    </div>

                    {/* Price + Tax Type row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Precio USD *</label>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={form.price}
                                onChange={(e) => setForm({ ...form, price: e.target.value })}
                                required
                                className="w-full px-4 py-2.5 rounded-xl bg-[#f3f6f4] border border-gray-200 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Tipo Fiscal *</label>
                            <select
                                value={form.taxType}
                                onChange={(e) => setForm({ ...form, taxType: e.target.value as "gravado" | "exento" })}
                                className="w-full px-4 py-2.5 rounded-xl bg-[#f3f6f4] border border-gray-200 text-gray-900 text-sm focus:outline-none focus:border-primary/50 transition-all"
                            >
                                <option value="gravado">Gravado (IVA 16%)</option>
                                <option value="exento">Exento (sin IVA)</option>
                            </select>
                        </div>
                    </div>

                    {/* IVA calculation preview */}
                    {priceNum > 0 && (
                        <div className={`rounded-xl p-3 border ${form.taxType === "gravado" ? "bg-blue-50 border-blue-200" : "bg-amber-50 border-amber-200"}`}>
                            <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-gray-500">Precio base</span>
                                <span className="font-bold text-gray-700">${priceNum.toFixed(2)}</span>
                            </div>
                            {form.taxType === "gravado" && (
                                <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="text-gray-500">IVA (16%)</span>
                                    <span className="font-bold text-blue-600">+${ivaAmount.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex items-center justify-between text-sm pt-1 border-t border-gray-200/50">
                                <span className="font-bold text-gray-700">Total</span>
                                <span className="font-extrabold text-primary">${totalWithIva.toFixed(2)}</span>
                            </div>
                            {form.taxType === "exento" && (
                                <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[12px]">info</span>
                                    Este producto está exento de IVA
                                </p>
                            )}
                        </div>
                    )}

                    {/* SKU + Location */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">SKU</label>
                            <input
                                type="text"
                                value={form.sku}
                                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl bg-[#f3f6f4] border border-gray-200 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-primary/50 transition-all"
                                placeholder="Opcional"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">Ubicación</label>
                            <input
                                type="text"
                                value={form.location}
                                onChange={(e) => setForm({ ...form, location: e.target.value })}
                                className="w-full px-4 py-2.5 rounded-xl bg-[#f3f6f4] border border-gray-200 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-primary/50 transition-all"
                                placeholder="Ej: Vitrina A"
                            />
                        </div>
                    </div>

                    {/* Image URL */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 block">URL de Imagen</label>
                        <input
                            type="url"
                            value={form.imageUrl}
                            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                            className="w-full px-4 py-2.5 rounded-xl bg-[#f3f6f4] border border-gray-200 text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:border-primary/50 transition-all"
                            placeholder="https://..."
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-500 text-xs font-medium rounded-xl p-3">
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
                                className="px-4 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-500 text-sm font-bold hover:bg-red-100 transition-all"
                            >
                                Eliminar
                            </button>
                        )}
                        <div className="flex-1" />
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-500 text-sm font-bold hover:bg-gray-200 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-soft hover:brightness-110 transition-all disabled:opacity-50"
                        >
                            {saving ? "Guardando..." : isEdit ? "Actualizar" : "Crear"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
