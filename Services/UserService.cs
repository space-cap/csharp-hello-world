using System.Collections.Concurrent;
using csharp_hello_world.Models.DTOs;
using csharp_hello_world.Models.Entities;

namespace csharp_hello_world.Services;

/// <summary>
/// IUserService 구현체 - 스레드 안전한 인메모리 저장소 기반 비즈니스 로직
/// </summary>
public class UserService : IUserService
{
    private static readonly ConcurrentDictionary<int, User> _users = new();
    private static int _nextId = 1;

    static UserService()
    {
        // 초기 샘플 데이터
        AddInitialUser("홍길동", "hong@example.com");
        AddInitialUser("김철수", "kim@example.com");
        AddInitialUser("이영희", "lee@example.com");
    }

    private static void AddInitialUser(string name, string email)
    {
        var id = _nextId++;
        _users[id] = new User
        {
            Id = id,
            Name = name,
            Email = email,
            CreatedAt = DateTime.UtcNow.AddDays(-id),
            IsActive = true
        };
    }

    public Task<IEnumerable<UserResponse>> GetAllUsersAsync()
    {
        var list = _users.Values
            .OrderBy(u => u.Id)
            .Select(ToResponse);

        return Task.FromResult<IEnumerable<UserResponse>>(list);
    }

    public Task<UserResponse?> GetUserByIdAsync(int id)
    {
        if (_users.TryGetValue(id, out var user))
        {
            return Task.FromResult<UserResponse?>(ToResponse(user));
        }

        return Task.FromResult<UserResponse?>(null);
    }

    public Task<UserResponse> CreateUserAsync(CreateUserRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            throw new ArgumentException("이름은 필수 항목입니다.", nameof(request.Name));
        }

        if (string.IsNullOrWhiteSpace(request.Email))
        {
            throw new ArgumentException("이메일은 필수 항목입니다.", nameof(request.Email));
        }

        var newId = Interlocked.Increment(ref _nextId);
        var user = new User
        {
            Id = newId,
            Name = request.Name.Trim(),
            Email = request.Email.Trim(),
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        _users[newId] = user;
        return Task.FromResult(ToResponse(user));
    }

    public Task<UserResponse?> UpdateUserAsync(int id, UpdateUserRequest request)
    {
        if (!_users.TryGetValue(id, out var user))
        {
            return Task.FromResult<UserResponse?>(null);
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            throw new ArgumentException("이름은 필수 항목입니다.", nameof(request.Name));
        }

        user.Name = request.Name.Trim();
        user.IsActive = request.IsActive;

        return Task.FromResult<UserResponse?>(ToResponse(user));
    }

    public Task<bool> DeleteUserAsync(int id)
    {
        var removed = _users.TryRemove(id, out _);
        return Task.FromResult(removed);
    }

    private static UserResponse ToResponse(User user) =>
        new(user.Id, user.Name, user.Email, user.CreatedAt, user.IsActive);
}
