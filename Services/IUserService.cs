using csharp_hello_world.Models.DTOs;

namespace csharp_hello_world.Services;

/// <summary>
/// 사용자 관련 비즈니스 로직 인터페이스 (DI 주입용)
/// </summary>
public interface IUserService
{
    Task<IEnumerable<UserResponse>> GetAllUsersAsync();
    Task<UserResponse?> GetUserByIdAsync(int id);
    Task<UserResponse> CreateUserAsync(CreateUserRequest request);
    Task<UserResponse?> UpdateUserAsync(int id, UpdateUserRequest request);
    Task<bool> DeleteUserAsync(int id);
}
