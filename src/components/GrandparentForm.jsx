import { useState } from 'react';
import Modal from './Modal';
import { saveGrandparents, uploadPhoto } from '../firebase/familyService';
import { Camera, Save, Loader2 } from 'lucide-react';

export default function GrandparentForm({ isOpen, onClose, grandparentData, type, onSave }) {
  const [form, setForm] = useState({
    name: grandparentData?.name || '',
    fullName: grandparentData?.fullName || '',
    gender: grandparentData?.gender || '',
    birthDate: grandparentData?.birthDate || '',
    deathDate: grandparentData?.deathDate || '',
    birthPlace: grandparentData?.birthPlace || '',
    role: grandparentData?.role || '',
    bio: grandparentData?.bio || '',
    quote: grandparentData?.quote || '',
    values: grandparentData?.values ? grandparentData.values.join(', ') : '',
    weddingDate: grandparentData?.weddingDate || '',
    weddingPlace: grandparentData?.weddingPlace || '',
    story: grandparentData?.story || '',
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(grandparentData?.photoURL || null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let photoURL = grandparentData?.photoURL || null;

      if (photoFile) {
        photoURL = await uploadPhoto(photoFile, `grandparents/${type}`);
      }

      const data = {
        ...form,
        values: form.values
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean),
        photoURL,
      };

      await onSave(data);
      onClose();
    } catch (error) {
      console.error('Error saving grandparent:', error);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-[#C4704B]/20 bg-white px-4 py-2.5 text-[#5D4037] focus:outline-none focus:ring-2 focus:ring-[#C4704B]/30';
  const labelClass = 'block text-sm font-medium text-[#5D4037] mb-1';

  const title = type === 'grandfather' ? 'Editar Abuelo' : 'Editar Abuela';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-5 p-4">
        {/* Photo upload */}
        <div className="flex justify-center">
          <label className="relative cursor-pointer group">
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Preview"
                className="w-28 h-28 rounded-full object-cover border-2 border-[#C4704B]/30 group-hover:opacity-80 transition"
              />
            ) : (
              <div className="w-28 h-28 rounded-full border-2 border-dashed border-[#C4704B]/40 flex flex-col items-center justify-center text-[#C4704B]/60 group-hover:border-[#C4704B] transition">
                <Camera className="w-8 h-8 mb-1" />
                <span className="text-xs">Subir foto</span>
              </div>
            )}
          </label>
        </div>

        {/* Name */}
        <div>
          <label className={labelClass}>Nombre</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className={inputClass}
            placeholder="Nombre corto"
          />
        </div>

        {/* Full Name */}
        <div>
          <label className={labelClass}>Nombre completo</label>
          <input
            type="text"
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            className={inputClass}
            placeholder="Nombre completo"
          />
        </div>

        {/* Gender */}
        <div>
          <label className={labelClass}>Genero</label>
          <select name="gender" value={form.gender} onChange={handleChange} className={inputClass}>
            <option value="">Seleccionar</option>
            <option value="M">Hombre</option>
            <option value="F">Mujer</option>
          </select>
        </div>

        {/* Birth Date & Death Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Fecha de nacimiento</label>
            <input
              type="date"
              name="birthDate"
              value={form.birthDate}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Fecha de fallecimiento</label>
            <input
              type="date"
              name="deathDate"
              value={form.deathDate}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
        </div>

        {/* Birth Place */}
        <div>
          <label className={labelClass}>Lugar de nacimiento</label>
          <input
            type="text"
            name="birthPlace"
            value={form.birthPlace}
            onChange={handleChange}
            className={inputClass}
            placeholder="Ciudad, Estado"
          />
        </div>

        {/* Role */}
        <div>
          <label className={labelClass}>Rol</label>
          <input
            type="text"
            name="role"
            value={form.role}
            onChange={handleChange}
            className={inputClass}
            placeholder="Ej. Patriarca, Matriarca"
          />
        </div>

        {/* Bio */}
        <div>
          <label className={labelClass}>Biografia</label>
          <textarea
            name="bio"
            value={form.bio}
            onChange={handleChange}
            rows={3}
            className={inputClass}
            placeholder="Breve biografia..."
          />
        </div>

        {/* Quote */}
        <div>
          <label className={labelClass}>Frase memorable</label>
          <input
            type="text"
            name="quote"
            value={form.quote}
            onChange={handleChange}
            className={inputClass}
            placeholder="Una frase que lo/la represente"
          />
        </div>

        {/* Values */}
        <div>
          <label className={labelClass}>Valores (separados por coma)</label>
          <input
            type="text"
            name="values"
            value={form.values}
            onChange={handleChange}
            className={inputClass}
            placeholder="Fe, Trabajo, Familia"
          />
        </div>

        {/* Wedding section - shown for grandfather type */}
        {type === 'grandfather' && (
          <div className="border-t border-[#C4704B]/20 pt-5 mt-5 space-y-4">
            <h3 className="text-sm font-semibold text-[#5D4037] uppercase tracking-wide">
              Informacion de boda
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Fecha de boda</label>
                <input
                  type="date"
                  name="weddingDate"
                  value={form.weddingDate}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Lugar de boda</label>
                <input
                  type="text"
                  name="weddingPlace"
                  value={form.weddingPlace}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Iglesia, Ciudad"
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Historia de amor</label>
              <textarea
                name="story"
                value={form.story}
                onChange={handleChange}
                rows={3}
                className={inputClass}
                placeholder="Como se conocieron..."
              />
            </div>
          </div>
        )}

        {/* Submit button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-[#C4704B] text-white rounded-lg px-6 py-2.5 hover:bg-[#C4704B]/90 disabled:opacity-50 transition"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Guardar
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
