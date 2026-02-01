import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMyBag, useAddClub, useDeleteClub, useUpdateBag } from '@/api/equipment'
import { GOLF_BRANDS, POPULAR_CLUB_MODELS, GOLF_BALLS, getBrandById, type GolfBrand } from '@/lib/golfBrands'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Input, Select } from '@/components/ui'

// Club type display order and icons
const CLUB_TYPES = [
  { type: 'driver', label: 'Driver', icon: '🏌️' },
  { type: '3_wood', label: '3 Wood', icon: '🪵' },
  { type: '5_wood', label: '5 Wood', icon: '🪵' },
  { type: '7_wood', label: '7 Wood', icon: '🪵' },
  { type: 'hybrid', label: 'Hybrid', icon: '🔀' },
  { type: 'iron', label: 'Irons', icon: '⛳' },
  { type: 'wedge', label: 'Wedges', icon: '🎯' },
  { type: 'putter', label: 'Putter', icon: '🏒' },
]

// Brand Logo Component
function BrandLogo({ brand, size = 'md', selected = false }: { brand: GolfBrand; size?: 'sm' | 'md' | 'lg'; selected?: boolean }) {
  const sizeClasses = {
    sm: 'w-16 h-8',
    md: 'w-24 h-12',
    lg: 'w-32 h-16',
  }
  
  return (
    <div 
      className={`
        ${sizeClasses[size]} flex items-center justify-center p-2 rounded-lg transition-all
        ${selected 
          ? 'bg-cyan/20 border-2 border-cyan shadow-glow-sm' 
          : 'bg-surface border border-border hover:border-cyan/30'
        }
      `}
    >
      <img 
        src={brand.logoPath} 
        alt={brand.name}
        className="w-full h-full object-contain"
        onError={(e) => {
          // Fallback to text if image fails
          e.currentTarget.style.display = 'none'
          e.currentTarget.parentElement!.innerHTML = `<span class="text-xs font-bold text-muted">${brand.name}</span>`
        }}
      />
    </div>
  )
}

// Club Card Component
function ClubCard({ 
  club, 
  onDelete 
}: { 
  club: { id: string; brand_id: string; model_name: string; club_label: string | null; club_type: string }
  onDelete: () => void
}) {
  const brand = getBrandById(club.brand_id)
  
  return (
    <div className="group relative p-4 rounded-xl bg-graphite border border-border hover:border-cyan/30 transition-all">
      <div className="flex items-center gap-4">
        {brand && (
          <div className="w-12 h-6 flex items-center justify-center">
            <img 
              src={brand.logoPath} 
              alt={brand.name}
              className="w-full h-full object-contain"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-ice-white font-medium truncate">{club.model_name}</p>
          <p className="text-sm text-muted">{club.club_label || club.club_type}</p>
        </div>
      </div>
      <button
        onClick={onDelete}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

// Add Club Modal
function AddClubModal({ 
  bagId, 
  onClose 
}: { 
  bagId: string
  onClose: () => void 
}) {
  const [step, setStep] = useState<'brand' | 'type' | 'model'>('brand')
  const [selectedBrand, setSelectedBrand] = useState<GolfBrand | null>(null)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState('')
  const [clubLabel, setClubLabel] = useState('')
  
  const addClub = useAddClub()
  
  const brandModels = selectedBrand ? POPULAR_CLUB_MODELS[selectedBrand.id] || [] : []
  const filteredModels = selectedType 
    ? brandModels.filter(m => m.type === selectedType)
    : brandModels
  
  const handleAddClub = async () => {
    if (!selectedBrand || !selectedType || !selectedModel) return
    
    await addClub.mutateAsync({
      bagId,
      data: {
        brand_id: selectedBrand.id,
        club_type: selectedType,
        model_name: selectedModel,
        club_label: clubLabel || undefined,
      }
    })
    onClose()
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-surface rounded-2xl border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-display font-bold text-ice-white">Add Club to Bag</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-graphite transition-colors">
            <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Progress */}
        <div className="flex px-6 pt-4">
          {['brand', 'type', 'model'].map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === s ? 'bg-cyan text-obsidian' : 
                ['brand', 'type', 'model'].indexOf(step) > i ? 'bg-cyan/30 text-cyan' : 'bg-graphite text-muted'
              }`}>
                {i + 1}
              </div>
              {i < 2 && (
                <div className={`flex-1 h-0.5 mx-2 ${
                  ['brand', 'type', 'model'].indexOf(step) > i ? 'bg-cyan/30' : 'bg-graphite'
                }`} />
              )}
            </div>
          ))}
        </div>
        
        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {step === 'brand' && (
            <div>
              <p className="text-muted mb-4">Select the brand of your club</p>
              <div className="grid grid-cols-4 gap-3">
                {GOLF_BRANDS.filter(b => b.categories.includes('clubs')).map((brand) => (
                  <button
                    key={brand.id}
                    onClick={() => {
                      setSelectedBrand(brand)
                      setStep('type')
                    }}
                    className={`p-3 rounded-xl border transition-all ${
                      selectedBrand?.id === brand.id 
                        ? 'border-cyan bg-cyan/10' 
                        : 'border-border hover:border-cyan/30 bg-graphite'
                    }`}
                  >
                    <div className="h-8 flex items-center justify-center">
                      <img 
                        src={brand.logoPath} 
                        alt={brand.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <p className="text-xs text-muted mt-2 truncate">{brand.name}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {step === 'type' && selectedBrand && (
            <div>
              <button onClick={() => setStep('brand')} className="text-cyan text-sm mb-4 hover:underline">
                ← Change Brand
              </button>
              <p className="text-muted mb-4">What type of club is this?</p>
              <div className="grid grid-cols-4 gap-3">
                {CLUB_TYPES.map((ct) => (
                  <button
                    key={ct.type}
                    onClick={() => {
                      setSelectedType(ct.type)
                      setStep('model')
                    }}
                    className={`p-4 rounded-xl border transition-all ${
                      selectedType === ct.type 
                        ? 'border-cyan bg-cyan/10' 
                        : 'border-border hover:border-cyan/30 bg-graphite'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{ct.icon}</span>
                    <p className="text-sm text-ice-white">{ct.label}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {step === 'model' && selectedBrand && selectedType && (
            <div>
              <button onClick={() => setStep('type')} className="text-cyan text-sm mb-4 hover:underline">
                ← Change Type
              </button>
              <p className="text-muted mb-4">Select or enter the model</p>
              
              {/* Popular Models */}
              {filteredModels.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-muted mb-2">Popular {selectedBrand.name} models:</p>
                  <div className="flex flex-wrap gap-2">
                    {filteredModels.map((model) => (
                      <button
                        key={model.name}
                        onClick={() => setSelectedModel(model.name)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                          selectedModel === model.name
                            ? 'bg-cyan text-obsidian'
                            : 'bg-graphite border border-border hover:border-cyan/30 text-ice-white'
                        }`}
                      >
                        {model.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Custom Model Input */}
              <Input
                label="Model Name"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                placeholder="e.g., Pro V1x, Stealth 2, etc."
              />
              
              <div className="mt-4">
                <Input
                  label="Club Label (optional)"
                  value={clubLabel}
                  onChange={(e) => setClubLabel(e.target.value)}
                  placeholder="e.g., 7 Iron, 56° Wedge"
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-border bg-graphite">
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            {step === 'model' && (
              <Button 
                onClick={handleAddClub} 
                disabled={!selectedModel}
                isLoading={addClub.isPending}
                className="flex-1"
              >
                Add to Bag
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Ball Selection Modal
function BallSelectionModal({
  currentBrand,
  currentModel,
  onSelect,
  onClose,
}: {
  currentBrand?: string
  currentModel?: string
  onSelect: (brand: string, model: string) => void
  onClose: () => void
}) {
  const [selectedBrand, setSelectedBrand] = useState(currentBrand || '')
  const [selectedModel, setSelectedModel] = useState(currentModel || '')
  
  const brandBalls = selectedBrand ? GOLF_BALLS[selectedBrand] || [] : []
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-surface rounded-2xl border border-border shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-display font-bold text-ice-white">Select Your Ball</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-graphite transition-colors">
            <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Brand Selection */}
          <p className="text-sm text-muted mb-3">Brand</p>
          <div className="grid grid-cols-3 gap-2 mb-6">
            {GOLF_BRANDS.filter(b => b.categories.includes('balls')).map((brand) => (
              <button
                key={brand.id}
                onClick={() => {
                  setSelectedBrand(brand.id)
                  setSelectedModel('')
                }}
                className={`p-3 rounded-xl border transition-all ${
                  selectedBrand === brand.id 
                    ? 'border-cyan bg-cyan/10' 
                    : 'border-border hover:border-cyan/30 bg-graphite'
                }`}
              >
                <div className="h-6 flex items-center justify-center">
                  <img 
                    src={brand.logoPath} 
                    alt={brand.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              </button>
            ))}
          </div>
          
          {/* Ball Model Selection */}
          {selectedBrand && brandBalls.length > 0 && (
            <>
              <p className="text-sm text-muted mb-3">Model</p>
              <div className="space-y-2">
                {brandBalls.map((ball) => (
                  <button
                    key={ball.name}
                    onClick={() => setSelectedModel(ball.name)}
                    className={`w-full p-4 rounded-xl border text-left transition-all ${
                      selectedModel === ball.name 
                        ? 'border-cyan bg-cyan/10' 
                        : 'border-border hover:border-cyan/30 bg-graphite'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-ice-white font-medium">{ball.name}</p>
                        <p className="text-xs text-muted capitalize">{ball.type} ball</p>
                      </div>
                      <Badge variant={ball.type === 'tour' ? 'cyan' : 'default'} size="sm">
                        {ball.year}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        
        <div className="p-6 border-t border-border bg-graphite">
          <div className="flex gap-3">
            <Button variant="secondary" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={() => onSelect(selectedBrand, selectedModel)}
              disabled={!selectedBrand || !selectedModel}
              className="flex-1"
            >
              Select Ball
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MyBag() {
  const { t } = useTranslation()
  const { data: bag, isLoading } = useMyBag()
  const updateBag = useUpdateBag()
  const deleteClub = useDeleteClub()
  
  const [showAddClub, setShowAddClub] = useState(false)
  const [showBallSelection, setShowBallSelection] = useState(false)
  
  const handleDeleteClub = async (clubId: string) => {
    if (confirm('Remove this club from your bag?')) {
      await deleteClub.mutateAsync(clubId)
    }
  }
  
  const handleSelectBall = async (brand: string, model: string) => {
    if (bag) {
      await updateBag.mutateAsync({
        bagId: bag.id,
        data: { ball_brand: brand, ball_model: model }
      })
    }
    setShowBallSelection(false)
  }
  
  // Group clubs by type
  const clubsByType = (bag?.clubs || []).reduce((acc, club) => {
    const type = club.club_type
    if (!acc[type]) acc[type] = []
    acc[type].push(club)
    return acc
  }, {} as Record<string, typeof bag.clubs>)
  
  const ballBrand = bag?.ball_brand ? getBrandById(bag.ball_brand) : null
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 shimmer rounded" />
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-48 shimmer rounded-xl" />
          ))}
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-display font-bold text-ice-white">
            {t('myBag.title', 'My Bag')}
          </h1>
          <p className="text-muted mt-1">
            {bag?.clubs.length || 0} / 14 clubs
          </p>
        </div>
        <Button onClick={() => setShowAddClub(true)} disabled={(bag?.clubs.length || 0) >= 14}>
          Add Club
        </Button>
      </div>
      
      {/* Ball Selection */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-surface to-graphite p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-ice-white flex items-center justify-center shadow-lg">
                <span className="text-3xl">⛳</span>
              </div>
              <div>
                <p className="text-sm text-muted mb-1">Game Ball</p>
                {bag?.ball_model ? (
                  <div className="flex items-center gap-3">
                    {ballBrand && (
                      <div className="h-5 w-10 flex items-center justify-center">
                        <img 
                          src={ballBrand.logoPath} 
                          alt={ballBrand.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    <span className="text-ice-white font-medium">{bag.ball_model}</span>
                  </div>
                ) : (
                  <p className="text-ice-white font-medium">Not selected</p>
                )}
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setShowBallSelection(true)}>
              {bag?.ball_model ? 'Change' : 'Select Ball'}
            </Button>
          </div>
        </div>
      </Card>
      
      {/* Clubs Grid */}
      <div className="space-y-6">
        {CLUB_TYPES.map(({ type, label, icon }) => {
          const clubs = clubsByType[type] || []
          if (clubs.length === 0 && type !== 'driver' && type !== 'putter') return null
          
          return (
            <Card key={type}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>{icon}</span>
                  {label}
                  {clubs.length > 0 && (
                    <Badge variant="default" size="sm">{clubs.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {clubs.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {clubs.map(club => (
                      <ClubCard 
                        key={club.id} 
                        club={club}
                        onDelete={() => handleDeleteClub(club.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddClub(true)}
                    className="w-full p-6 rounded-xl border-2 border-dashed border-border hover:border-cyan/30 transition-colors text-center"
                  >
                    <span className="text-3xl block mb-2">{icon}</span>
                    <p className="text-muted">Add your {label.toLowerCase()}</p>
                  </button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
      
      {/* Empty State */}
      {!bag?.clubs.length && (
        <Card className="border-dashed border-2 border-border">
          <CardContent className="py-12 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-surface flex items-center justify-center">
              <span className="text-4xl">🏌️</span>
            </div>
            <h3 className="text-lg font-medium text-ice-white mb-2">
              Start Building Your Bag
            </h3>
            <p className="text-muted max-w-md mx-auto mb-6">
              Add your clubs to track performance by equipment and get personalized insights.
            </p>
            <Button onClick={() => setShowAddClub(true)}>
              Add Your First Club
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Brand Showcase */}
      <Card>
        <CardHeader>
          <CardTitle>Supported Brands</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {GOLF_BRANDS.filter(b => b.categories.includes('clubs')).map((brand) => (
              <div
                key={brand.id}
                className="px-5 py-3 h-14 min-w-[100px] rounded-xl bg-surface/80 border border-border/50 flex items-center justify-center hover:border-cyan/30 transition-all"
              >
                <img 
                  src={brand.logoPath} 
                  alt={brand.name}
                  className="w-full h-full object-contain"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Modals */}
      {showAddClub && bag && (
        <AddClubModal bagId={bag.id} onClose={() => setShowAddClub(false)} />
      )}
      
      {showBallSelection && (
        <BallSelectionModal
          currentBrand={bag?.ball_brand || undefined}
          currentModel={bag?.ball_model || undefined}
          onSelect={handleSelectBall}
          onClose={() => setShowBallSelection(false)}
        />
      )}
    </div>
  )
}
