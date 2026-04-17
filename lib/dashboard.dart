import 'package:flutter/material.dart';
import 'services/auth_service.dart';
import 'services/recommendations_service.dart';
import 'services/friends_service.dart';
import 'auth_page.dart';

// --- Constants ---
const Color kPrimaryBlue = Color(0xFF1149A8);
const Color kBackgroundColor = Color(0xFFF4F3F1);
const double kMobileBreakpoint = 700;

class DashboardPage extends StatefulWidget {
  final String? fullname;
  const DashboardPage({super.key, this.fullname});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  // ─── State ────────────────────────────────────────────────────────────────
  List<Map<String, dynamic>> _movies = [];
  List<Map<String, dynamic>> _tvShows = [];
  List<Map<String, dynamic>> _music = [];
  List<Map<String, dynamic>> _friends = [];

  bool _isLoadingRecs = true;
  bool _isLoadingFriends = true;

  String _recSearchQuery = '';
  final TextEditingController _recSearchController = TextEditingController();

  // Filtered views based on search query
  List<Map<String, dynamic>> get _filteredMovies => _recSearchQuery.isEmpty
      ? _movies
      : _movies.where((r) => r['title']
          .toString().toLowerCase()
          .contains(_recSearchQuery.toLowerCase())).toList();

  List<Map<String, dynamic>> get _filteredTv => _recSearchQuery.isEmpty
      ? _tvShows
      : _tvShows.where((r) => r['title']
          .toString().toLowerCase()
          .contains(_recSearchQuery.toLowerCase())).toList();

  List<Map<String, dynamic>> get _filteredMusic => _recSearchQuery.isEmpty
      ? _music
      : _music.where((r) => r['title']
          .toString().toLowerCase()
          .contains(_recSearchQuery.toLowerCase())).toList();

  @override
  void initState() {
    super.initState();
    _loadRecommendations();
    _loadFriends();
  }

  @override
  void dispose() {
    _recSearchController.dispose();
    super.dispose();
  }

  // ─── Data loaders ─────────────────────────────────────────────────────────
  Future<void> _loadRecommendations() async {
    setState(() => _isLoadingRecs = true);
    final result = await RecommendationsService.getMyRecommendations();
    if (result['success'] && mounted) {
      final all = List<Map<String, dynamic>>.from(result['data']);
      setState(() {
        _movies  = all.where((r) => r['category'] == 'movie').toList();
        _tvShows = all.where((r) => r['category'] == 'tv').toList();
        _music   = all.where((r) => r['category'] == 'music').toList();
      });
    }
    if (mounted) setState(() => _isLoadingRecs = false);
  }

  Future<void> _loadFriends() async {
    setState(() => _isLoadingFriends = true);
    final result = await FriendsService.getFriends();
    if (result['success'] && mounted) {
      setState(() {
        _friends = List<Map<String, dynamic>>.from(result['data']);
      });
    }
    if (mounted) setState(() => _isLoadingFriends = false);
  }

  // ─── Actions ──────────────────────────────────────────────────────────────
  Future<void> _handleLogout() async {
    await AuthService.logout();
    if (mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const AuthPage()),
      );
    }
  }

  void _handleRecSearch(String query) {
    setState(() => _recSearchQuery = query.trim());
  }

  Future<void> _handleSendFollowRequest(Map<String, dynamic> user) async {
    final result = await FriendsService.sendFollowRequest(
      followingId: user['_id'].toString(),
    );
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(result['success']
            ? 'Follow request sent to @${user['username']}'
            : result['message'] ?? 'Failed to send request'),
        backgroundColor: result['success'] ? Colors.green : Colors.red,
      ));
      if (result['success']) {
        setState(() {});
      }
    }
  }

  Future<void> _handleRemoveFriend(Map<String, dynamic> friend) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("Remove Friend"),
        content: Text("Remove @${friend['username']}?"),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text("Cancel")),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text("Remove", style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    final result = await FriendsService.removeFriend(
      friendId: friend['id'].toString(),
    );
    if (mounted) {
      if (result['success']) {
        setState(() => _friends.removeWhere((f) => f['id'] == friend['id']));
      }
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text(result['success']
            ? '@${friend['username']} removed'
            : result['message'] ?? 'Failed to remove'),
        backgroundColor: result['success'] ? Colors.grey : Colors.red,
      ));
    }
  }

  Future<void> _handleDeleteRec(Map<String, dynamic> rec) async {
    final result = await RecommendationsService.deleteRecommendation(
      id: rec['_id'].toString(),
    );
    if (result['success'] && mounted) _loadRecommendations();
  }

  // ─── Add Recommendation dialog ────────────────────────────────────────────
  void _showAddRecDialog() {
    final titleController = TextEditingController();
    final notesController = TextEditingController();
    String selectedCategory = 'movie';
    int selectedRating = 0;

    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (ctx) => Theme(
        data: ThemeData(brightness: Brightness.light, useMaterial3: true, colorSchemeSeed: const Color(0xFF1149A8)),
        child: StatefulBuilder(
          builder: (ctx, setDialogState) => Dialog(
            backgroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
            child: Padding(
            padding: const EdgeInsets.all(28),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Flexible(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text("Add to your diary",
                                style: TextStyle(
                                    fontSize: 22, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 4),
                            const Text("Save something worth recommending",
                                style: TextStyle(
                                    color: Colors.grey, fontSize: 13)),
                          ],
                        ),
                      ),
                      IconButton(
                        onPressed: () => Navigator.pop(ctx),
                        icon: const Icon(Icons.close, color: Colors.grey),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  // Title
                  const Text("Title",
                      style: TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  TextField(
                    controller: titleController,
                    decoration: InputDecoration(
                      hintText: "What are you recommending?",
                      hintStyle: TextStyle(color: Colors.grey.shade400),
                      filled: true,
                      fillColor: Colors.grey.shade100,
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: BorderSide.none),
                    ),
                  ),
                  const SizedBox(height: 20),
                  // Category
                  const Text("Category",
                      style: TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: selectedCategory,
                        isExpanded: true,
                        borderRadius: BorderRadius.circular(14),
                        items: const [
                          DropdownMenuItem(value: 'movie', child: Text("🎬 Movies")),
                          DropdownMenuItem(value: 'tv',    child: Text("📺 TV Shows")),
                          DropdownMenuItem(value: 'music', child: Text("🎵 Music")),
                        ],
                        onChanged: (v) =>
                            setDialogState(() => selectedCategory = v!),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  // Star rating
                  const Text("Rating",
                      style: TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  Row(
                    children: List.generate(5, (i) => GestureDetector(
                      onTap: () => setDialogState(() => selectedRating = i + 1),
                      child: Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: Icon(
                          i < selectedRating ? Icons.star : Icons.star_border,
                          color: i < selectedRating
                              ? Colors.amber
                              : Colors.grey.shade300,
                          size: 32,
                        ),
                      ),
                    )),
                  ),
                  const SizedBox(height: 20),
                  // Notes
                  const Text("Notes",
                      style: TextStyle(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  TextField(
                    controller: notesController,
                    maxLines: 4,
                    decoration: InputDecoration(
                      hintText: "Why should your friends check this out?",
                      hintStyle: TextStyle(color: Colors.grey.shade400),
                      filled: true,
                      fillColor: Colors.grey.shade100,
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(14),
                          borderSide: BorderSide.none),
                    ),
                  ),
                  const SizedBox(height: 28),
                  // Submit button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: kPrimaryBlue,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14)),
                      ),
                      onPressed: () async {
                        if (titleController.text.trim().isEmpty ||
                            notesController.text.trim().isEmpty ||
                            selectedRating == 0) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text("Please fill in all fields and select a rating"),
                              backgroundColor: Colors.red,
                            ),
                          );
                          return;
                        }
                        Navigator.pop(ctx);
                        final result = await RecommendationsService.addRecommendation(
                          title: titleController.text.trim(),
                          category: selectedCategory,
                          rating: selectedRating.toString(),
                          notes: notesController.text.trim(),
                        );
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                            content: Text(result['success']
                                ? 'Added to your diary!'
                                : result['message'] ?? 'Failed to add'),
                            backgroundColor:
                                result['success'] ? Colors.green : Colors.red,
                          ));
                          if (result['success']) _loadRecommendations();
                        }
                      },
                      child: const Text("Add to Diary",
                          style: TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.w600)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    ),
  );
  }

  // ─── Add Friend dialog ────────────────────────────────────────────────────
  void _showAddFriendDialog() {
    final controller = TextEditingController();
    List<Map<String, dynamic>> results = [];
    List<Map<String, dynamic>> pendingRequests = [];
    bool isSearching = false;
    bool loadingPending = true;

    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (ctx) => Theme(
        data: ThemeData(brightness: Brightness.light, useMaterial3: true, colorSchemeSeed: const Color(0xFF1149A8)),
        child: StatefulBuilder(
          builder: (ctx, setDialogState) {
          // Load pending requests once on open
          if (loadingPending) {
            loadingPending = false;
            FriendsService.getPendingRequests().then((res) {
              if (res['success']) {
                setDialogState(() {
                  pendingRequests =
                      List<Map<String, dynamic>>.from(res['data']);
                });
              }
            });
          }

          return Dialog(
            backgroundColor: Colors.white,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
            child: Padding(
              padding: const EdgeInsets.all(28),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text("Add a Friend",
                                style: TextStyle(
                                    fontSize: 22,
                                    fontWeight: FontWeight.bold)),
                            SizedBox(height: 4),
                            Text("Search by username to connect",
                                style: TextStyle(
                                    color: Colors.grey, fontSize: 13)),
                          ],
                        ),
                        IconButton(
                          onPressed: () => Navigator.pop(ctx),
                          icon: const Icon(Icons.close, color: Colors.grey),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    // Search row
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: controller,
                            decoration: InputDecoration(
                              hintText: "Username",
                  hintStyle: TextStyle(color: Colors.grey.shade400),
                              filled: true,
                              fillColor: Colors.grey.shade100,
                              border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: BorderSide(
                                      color: kPrimaryBlue, width: 1.5)),
                              enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: BorderSide(
                                      color: Colors.grey.shade300)),
                              focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(12),
                                  borderSide: const BorderSide(
                                      color: kPrimaryBlue, width: 1.5)),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: kPrimaryBlue,
                            padding: const EdgeInsets.symmetric(
                                horizontal: 20, vertical: 16),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12)),
                          ),
                          onPressed: () async {
                            final q = controller.text.trim();
                            if (q.isEmpty) return;
                            setDialogState(() => isSearching = true);
                            final res = await FriendsService.searchUsers(q);
                            setDialogState(() {
                              results = res['success']
                                  ? List<Map<String, dynamic>>.from(res['data'])
                                  : [];
                              isSearching = false;
                            });
                          },
                          child: isSearching
                              ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(
                                      color: Colors.white, strokeWidth: 2))
                              : const Text("Search",
                                  style: TextStyle(color: Colors.white)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    // Search results
                    if (results.isNotEmpty) ...[
                      ...results.map((user) {
                        final isFriend = _friends.any(
                            (f) => f['id'].toString() == user['_id'].toString());
                        return Container(
                          margin: const EdgeInsets.only(bottom: 10),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 12),
                          decoration: BoxDecoration(
                            color: Colors.grey.shade50,
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Row(
                            children: [
                              CircleAvatar(
                                backgroundColor: kPrimaryBlue,
                                child: Text(
                                  user['username'][0].toUpperCase(),
                                  style: const TextStyle(color: Colors.white),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Text('@${user['username']}',
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w600)),
                              const Spacer(),
                              if (isFriend)
                                OutlinedButton(
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: Colors.red,
                                    side: const BorderSide(color: Colors.red),
                                    shape: RoundedRectangleBorder(
                                        borderRadius:
                                            BorderRadius.circular(10)),
                                  ),
                                  onPressed: () async {
                                    Navigator.pop(ctx);
                                    await _handleRemoveFriend(user);
                                  },
                                  child: const Text("Remove"),
                                )
                              else
                                ElevatedButton(
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: kPrimaryBlue,
                                    shape: RoundedRectangleBorder(
                                        borderRadius:
                                            BorderRadius.circular(10)),
                                  ),
                                  onPressed: () async {
                                    Navigator.pop(ctx);
                                    await _handleSendFollowRequest(user);
                                  },
                                  child: const Text("Add",
                                      style:
                                          TextStyle(color: Colors.white)),
                                ),
                            ],
                          ),
                        );
                      }),
                      const SizedBox(height: 8),
                    ] else if (controller.text.isNotEmpty && !isSearching) ...[
                      Center(
                        child: Text("No users found",
                            style: TextStyle(color: Colors.grey.shade500)),
                      ),
                      const SizedBox(height: 8),
                    ],
                    // Divider + Pending Requests
                    const Divider(),
                    const SizedBox(height: 8),
                    const Text("Pending Requests",
                        style: TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 15)),
                    const SizedBox(height: 10),
                    if (pendingRequests.isEmpty)
                      Text("No pending requests right now.",
                          style: TextStyle(
                              color: Colors.grey.shade400,
                              fontStyle: FontStyle.italic))
                    else
                      ...pendingRequests.map((req) => Container(
                            margin: const EdgeInsets.only(bottom: 10),
                            padding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 12),
                            decoration: BoxDecoration(
                              color: Colors.grey.shade50,
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: Row(
                              children: [
                                CircleAvatar(
                                  backgroundColor: kPrimaryBlue,
                                  child: Text(
                                    req['username'][0].toUpperCase(),
                                    style: const TextStyle(
                                        color: Colors.white),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Text('@${req['username']}',
                                    style: const TextStyle(
                                        fontWeight: FontWeight.w600)),
                                const Spacer(),
                                IconButton(
                                  icon: const Icon(Icons.check_circle,
                                      color: Colors.green),
                                  onPressed: () async {
                                    await FriendsService.approveRequest(
                                        requestId: req['_id'].toString());
                                    setDialogState(() =>
                                        pendingRequests.remove(req));
                                    _loadFriends();
                                  },
                                ),
                                IconButton(
                                  icon: const Icon(Icons.cancel,
                                      color: Colors.red),
                                  onPressed: () async {
                                    await FriendsService.denyRequest(
                                        requestId: req['_id'].toString());
                                    setDialogState(() =>
                                        pendingRequests.remove(req));
                                  },
                                ),
                              ],
                            ),
                          )),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    ),
  );
  }

  // ─── Build ────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: kBackgroundColor,
      body: Column(
        children: [
          _buildNavbar(),
          Expanded(
            child: Container(
              width: double.infinity,
              decoration: const BoxDecoration(
                image: DecorationImage(
                  image: AssetImage('bg-characters.png'),
                  fit: BoxFit.cover,
                  opacity: 0.5,
                ),
              ),
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final isMobile = constraints.maxWidth < kMobileBreakpoint;
                  return isMobile
                      ? _buildMobileLayout()
                      : _buildDesktopLayout();
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDesktopLayout() {
    return Padding(
      padding: const EdgeInsets.all(20.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(flex: 3, child: _buildMainCard()),
          const SizedBox(width: 20),
          SizedBox(
            width: 300,
            child: Column(
              children: [
                _buildLibraryCard(),
                const SizedBox(height: 16),
                _buildFriendsCard(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMobileLayout() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        children: [
          _buildMainCard(),
          const SizedBox(height: 16),
          _buildLibraryCard(fullWidth: true),
          const SizedBox(height: 16),
          _buildFriendsCard(fullWidth: true),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  // ─── Cards ────────────────────────────────────────────────────────────────
  Widget _buildMainCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.9),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 20,
            offset: const Offset(0, 10),
          )
        ],
      ),
      child: _buildRecommendationContent(),
    );
  }

  BoxDecoration get _cardDecoration => BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 20,
            offset: const Offset(0, 10),
          )
        ],
      );

  Widget _buildLibraryCard({bool fullWidth = false}) {
    return Container(
      width: fullWidth ? double.infinity : null,
      padding: const EdgeInsets.all(20),
      decoration: _cardDecoration,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text("ADD TO LIBRARY",
              style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: Colors.grey)),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _recSearchController,
                  onChanged: _handleRecSearch,
                  decoration: InputDecoration(
                    hintText: "Find a rec...",
                    prefixIcon: const Icon(Icons.search, size: 20),
                    filled: true,
                    fillColor: Colors.grey.shade50,
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(15),
                        borderSide: BorderSide.none),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Container(
                decoration: BoxDecoration(
                    color: kPrimaryBlue,
                    borderRadius: BorderRadius.circular(12)),
                child: IconButton(
                    onPressed: _showAddRecDialog,
                    icon: const Icon(Icons.add, color: Colors.white)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFriendsCard({bool fullWidth = false}) {
    return Container(
      width: fullWidth ? double.infinity : null,
      padding: const EdgeInsets.all(20),
      decoration: _cardDecoration,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text("FRIENDS LIST",
              style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: Colors.grey)),
          const SizedBox(height: 14),
          if (_isLoadingFriends)
            const Center(
                child: CircularProgressIndicator(color: kPrimaryBlue))
          else if (_friends.isEmpty)
            Text("No friends yet — use Add Friend to connect!",
                style: TextStyle(
                    color: Colors.grey.shade400,
                    fontStyle: FontStyle.italic))
          else
            ..._friends.map((friend) => ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: CircleAvatar(
                      backgroundColor: kPrimaryBlue,
                      child: Text(
                        friend['username'][0].toUpperCase(),
                        style: const TextStyle(color: Colors.white),
                      )),
                  title: Text('@${friend['username']}'),
                  trailing: IconButton(
                    icon: const Icon(Icons.close, size: 16, color: Colors.grey),
                    onPressed: () => _handleRemoveFriend(friend),
                  ),
                )),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: _showAddFriendDialog,
              icon: const Icon(Icons.person_add_alt_1),
              label: const Text("Add Friend"),
              style: OutlinedButton.styleFrom(
                foregroundColor: kPrimaryBlue,
                side: const BorderSide(color: kPrimaryBlue, width: 2),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(15)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ─── Navbar ───────────────────────────────────────────────────────────────
  Widget _buildNavbar() {
    return Container(
      height: 70,
      padding: const EdgeInsets.symmetric(horizontal: 20),
      color: Colors.white,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Image.asset('logo-icon.png', height: 28),
              const SizedBox(width: 8),
              const Text("Ugotta",
                  style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: kPrimaryBlue)),
            ],
          ),
          Row(
            children: [
              Text(
                widget.fullname ?? "User",
                style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 16,
                    color: Colors.black),
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(width: 12),
              OutlinedButton.icon(
                onPressed: _handleLogout,
                icon: const Icon(Icons.logout, size: 18),
                label: const Text("Log out"),
                style: OutlinedButton.styleFrom(
                  foregroundColor: kPrimaryBlue,
                  side: BorderSide(color: kPrimaryBlue.withValues(alpha: 0.2)),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ─── Recommendations ──────────────────────────────────────────────────────
  Widget _buildRecommendationContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        const Text("Your Recommendations:",
            style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.black)),
        const SizedBox(height: 24),
        _isLoadingRecs
            ? const Center(
                child: CircularProgressIndicator(color: kPrimaryBlue))
            : Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (_filteredMovies.isNotEmpty || _recSearchQuery.isEmpty)
                    _buildCategoryRow("🎬 Movies:", _filteredMovies),
                  if ((_filteredMovies.isNotEmpty || _recSearchQuery.isEmpty) &&
                      (_filteredTv.isNotEmpty || _recSearchQuery.isEmpty))
                    const SizedBox(height: 30),
                  if (_filteredTv.isNotEmpty || _recSearchQuery.isEmpty)
                    _buildCategoryRow("📺 TV:", _filteredTv),
                  if ((_filteredTv.isNotEmpty || _recSearchQuery.isEmpty) &&
                      (_filteredMusic.isNotEmpty || _recSearchQuery.isEmpty))
                    const SizedBox(height: 30),
                  if (_filteredMusic.isNotEmpty || _recSearchQuery.isEmpty)
                    _buildCategoryRow("🎵 Music:", _filteredMusic),
                  if (_recSearchQuery.isNotEmpty &&
                      _filteredMovies.isEmpty &&
                      _filteredTv.isEmpty &&
                      _filteredMusic.isEmpty)
                    Text(
                      'No results for "$_recSearchQuery"',
                      style: TextStyle(
                          color: Colors.grey.shade400,
                          fontStyle: FontStyle.italic),
                    ),
                ],
              ),
      ],
    );
  }

  Widget _buildCategoryRow(String title, List<Map<String, dynamic>> recs) {
    final categoryName =
        title.split(' ')[1].replaceAll(':', '').toLowerCase();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title,
            style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Colors.black)),
        const SizedBox(height: 12),
        if (recs.isEmpty)
          Container(
            width: double.infinity,
            constraints: const BoxConstraints(maxWidth: 320),
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Text(
              "No $categoryName yet — hit the + to add one!",
              style: TextStyle(
                  color: Colors.grey.shade400,
                  fontStyle: FontStyle.italic),
            ),
          )
        else
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: recs.map((rec) => _buildRecCard(rec)).toList(),
          ),
      ],
    );
  }

  Widget _buildRecCard(Map<String, dynamic> rec) {
    return Container(
      width: 200,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(rec['title'] ?? '',
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 14, color: Colors.black),
                    overflow: TextOverflow.ellipsis),
              ),
              GestureDetector(
                onTap: () => _handleDeleteRec(rec),
                child:
                    const Icon(Icons.close, size: 14, color: Colors.grey),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            children: List.generate(
              5,
              (i) => Icon(
                i < int.parse(rec['rating'].toString())
                    ? Icons.star
                    : Icons.star_border,
                size: 14,
                color: Colors.amber,
              ),
            ),
          ),
          if (rec['notes'] != null &&
              rec['notes'].toString().isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(
              rec['notes'],
              style: TextStyle(
                  color: Colors.grey.shade500,
                  fontSize: 12,
                  fontStyle: FontStyle.italic),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ],
      ),
    );
  }

  // ─── Sidebar ──────────────────────────────────────────────────────────────
}