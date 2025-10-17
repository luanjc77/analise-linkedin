// src/JobForm.js

import React, { useState } from 'react';
import { FaGraduationCap, FaCode, FaLightbulb, FaRegClock, FaPaperclip, FaPlusSquare } from 'react-icons/fa';

function JobForm() {
  const [formData, setFormData] = useState({
    educationLevel: 'Graduação',
    requiredSkills: '',
    desiredSkills: '',
    experienceYears: 0,
    otherNotes: '',
    profilesFile: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setFormData(prevState => ({
      ...prevState,
      profilesFile: e.target.files[0]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Dados do Formulário Submetidos:", formData);
    alert('Vaga enviada para análise! Verifique o console para ver os dados.');
  };

  return (
   
    <div className="container" style={{ maxWidth: '700px' }}>

      <div className="card shadow border-0 rounded-3">

        <div className="card-header bg-dark text-white text-center">
          <h2>Analisador de Perfis do LinkedIn®</h2>
          <p className="mb-0">Descreva a vaga para encontrar os melhores candidatos</p>
        </div>
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            
            <div className="mb-3">
              <label htmlFor="educationLevel" className="form-label">
                <strong><FaGraduationCap className="me-2" />Grau de Escolaridade Mínimo</strong>
              </label>
              <select
                className="form-select"
                id="educationLevel"
                name="educationLevel"
                value={formData.educationLevel}
                onChange={handleChange}
              >
                <option value="Ensino Médio">Ensino Médio</option>
                <option value="Técnico">Técnico</option>
                <option value="Graduação">Graduação</option>
                <option value="Pós-graduação">Pós-graduação</option>
                <option value="Mestrado">Mestrado</option>
                <option value="Doutorado">Doutorado</option>
              </select>
            </div>

            <div className="mb-3">
              <label htmlFor="requiredSkills" className="form-label">
                <strong><FaCode className="me-2" />Conhecimentos Obrigatórios</strong>
              </label>
              <textarea
                className="form-control"
                id="requiredSkills"
                name="requiredSkills"
                rows="3"
                placeholder="Ex: React, Node.js, SQL Server (separe por vírgulas)"
                value={formData.requiredSkills}
                onChange={handleChange}
              ></textarea>
            </div>
            
            <div className="mb-3">
              <label htmlFor="desiredSkills" className="form-label">
                <strong><FaLightbulb className="me-2" />Conhecimentos Desejados</strong>
              </label>
              <textarea
                className="form-control"
                id="desiredSkills"
                name="desiredSkills"
                rows="3"
                placeholder="Ex: Docker, Kubernetes, AWS (separe por vírgulas)"
                value={formData.desiredSkills}
                onChange={handleChange}
              ></textarea>
            </div>

            <div className="mb-3">
              <label htmlFor="experienceYears" className="form-label">
                <strong><FaRegClock className="me-2" />Tempo de Experiência Mínimo (anos)</strong>
              </label>
              <input
                type="number"
                className="form-control"
                id="experienceYears"
                name="experienceYears"
                min="0"
                value={formData.experienceYears}
                onChange={handleChange}
              />
            </div>
            
            <div className="mb-3">
              <label htmlFor="otherNotes" className="form-label">
                <strong><FaPlusSquare className="me-2" />Outras Observações</strong>
              </label>
              <textarea
                className="form-control"
                id="otherNotes"
                name="otherNotes"
                rows="2"
                placeholder="Ex: Disponibilidade para viagens, trabalho remoto, etc."
                value={formData.otherNotes}
                onChange={handleChange}
              ></textarea>
            </div>
            
            <div className="mb-4">
              <label htmlFor="profilesFile" className="form-label">
                <strong><FaPaperclip className="me-2" />Dataset de Candidatos (.csv, .json)</strong>
              </label>
              <input
                type="file"
                className="form-control"
                id="profilesFile"
                name="profilesFile"
                accept=".csv,.json"
                onChange={handleFileChange}
              />
            </div>
            
            <button type="submit" className="btn btn-success w-100 p-2">
              Analisar Perfis
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default JobForm;