import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useFriends, useCreateInvite } from '@/api/auth'
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Badge } from '@/components/ui'

export default function Friends() {
  const { t } = useTranslation()
  const { data: friends, isLoading } = useFriends()
  const createInvite = useCreateInvite()

  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLink, setInviteLink] = useState('')

  const handleCreateInvite = async () => {
    const result = await createInvite.mutateAsync({ email: inviteEmail || undefined })
    setInviteLink(`https://strikelab.golf/invite/${result.token}`)
    setInviteEmail('')
  }

  // Demo leaderboard data
  const leaderboard = [
    { name: 'You', strikeScore: 78, handicap: 8.2, rank: 1 },
    { name: 'John D.', strikeScore: 82, handicap: 6.5, rank: 2 },
    { name: 'Sarah M.', strikeScore: 75, handicap: 10.1, rank: 3 },
    { name: 'Mike R.', strikeScore: 71, handicap: 12.4, rank: 4 },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-display font-bold text-ice-white">
            {t('friends.title')}
          </h1>
          <p className="text-muted mt-1">
            Compare metrics and compete with friends
          </p>
        </div>
        <Button onClick={() => setShowInvite(!showInvite)}>
          {t('friends.invite')}
        </Button>
      </div>

      {/* Invite Form */}
      {showInvite && (
        <Card>
          <CardHeader>
            <CardTitle>{t('friends.invite')}</CardTitle>
          </CardHeader>
          <CardContent className="mt-4 space-y-4">
            <Input
              label="Email (optional)"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="friend@example.com"
            />
            <Button onClick={handleCreateInvite} isLoading={createInvite.isPending}>
              Create Invite Link
            </Button>
            {inviteLink && (
              <div className="p-3 rounded-button bg-surface border border-border">
                <p className="text-xs text-muted mb-1">Share this link:</p>
                <p className="text-sm text-cyan break-all">{inviteLink}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Friends List */}
        <Card>
          <CardHeader>
            <CardTitle>{t('friends.accepted')}</CardTitle>
          </CardHeader>
          <CardContent className="mt-4">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 shimmer rounded-button" />
                ))}
              </div>
            ) : friends && friends.length > 0 ? (
              <div className="space-y-3">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-3 rounded-button bg-graphite border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center">
                        <span className="text-sm font-medium text-cyan">
                          {friend.display_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-ice-white font-medium">{friend.display_name}</p>
                        {friend.handicap_index && (
                          <p className="text-xs text-muted">HCP {friend.handicap_index}</p>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      {t('friends.compare')}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted">{t('friends.noFriends')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle>{t('friends.leaderboard')}</CardTitle>
          </CardHeader>
          <CardContent className="mt-4">
            <div className="space-y-2">
              {leaderboard.map((entry, index) => (
                <div
                  key={entry.name}
                  className={`flex items-center justify-between p-3 rounded-button ${
                    index === 0
                      ? 'bg-cyan/10 border border-cyan/30'
                      : 'bg-graphite border border-border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0
                          ? 'bg-cyan text-obsidian'
                          : 'bg-surface text-muted'
                      }`}
                    >
                      {entry.rank}
                    </span>
                    <div>
                      <p className={`font-medium ${index === 0 ? 'text-cyan' : 'text-ice-white'}`}>
                        {entry.name}
                      </p>
                      <p className="text-xs text-muted">HCP {entry.handicap}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-display font-bold text-ice-white">
                      {entry.strikeScore}
                    </p>
                    <p className="text-xs text-muted">Strike Score</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compare Feature Preview */}
      <Card className="border-dashed border-2 border-border">
        <CardContent className="py-12 text-center">
          <Badge variant="cyan" className="mb-4">Coming Soon</Badge>
          <h3 className="text-lg font-medium text-ice-white mb-2">
            Head-to-Head Compare
          </h3>
          <p className="text-muted max-w-md mx-auto">
            Select a friend to compare your metrics side-by-side. 
            See who has better strike quality, face control, and dispersion.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
